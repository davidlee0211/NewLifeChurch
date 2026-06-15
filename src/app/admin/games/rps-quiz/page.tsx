"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { getCurrentSeasonId } from "@/lib/seasons";
import {
  Hand,
  Coins,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  Sparkles,
  Maximize,
  Minimize,
  Users,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

type QuizType = "multiple_choice" | "short_answer";

interface RpsQuiz {
  id: string;
  quiz_type: QuizType;
  question: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  option4: string | null;
  correct_answer: number | null;
  correct_answer_text: string | null;
}

interface Student {
  id: string;
  name: string;
  talent: number;
  team_id: string | null;
}

const TALENT_PER_CORRECT = 1;

export default function RpsQuizPage() {
  const { churchId, user } = useAuth();
  const [quizzes, setQuizzes] = useState<RpsQuiz[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  // 퀴즈 id → 정답자 { studentId, recordId } 매핑. 페이지 로드 시 DB에서 복원.
  const [winnersByQuiz, setWinnersByQuiz] = useState<Map<string, { studentId: string; recordId: string }>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentQuiz = quizzes[currentIndex];

  const fetchData = useCallback(async () => {
    if (!churchId) return;
    setIsLoading(true);

    const [quizzesRes, studentsRes] = await Promise.all([
      supabase
        .from("rps_quizzes")
        .select("id, quiz_type, question, option1, option2, option3, option4, correct_answer, correct_answer_text")
        .eq("church_id", churchId)
        .eq("is_active", true)
        .order("order_index", { ascending: true }),
      supabase
        .from("students")
        .select("id, name, talent, team_id")
        .eq("church_id", churchId)
        .order("name", { ascending: true }),
    ]);

    const quizList = (quizzesRes.data as RpsQuiz[]) || [];
    setQuizzes(quizList);
    if (studentsRes.data) setStudents(studentsRes.data as Student[]);

    // 이미 정답자가 선택된 퀴즈가 있는지 DB에서 확인
    if (quizList.length > 0) {
      const quizIds = quizList.map(q => q.id);
      const { data: recordsData } = await supabase
        .from("quest_records")
        .select("id, student_id, quiz_id")
        .eq("church_id", churchId)
        .eq("type", "rps_quiz")
        .in("quiz_id", quizIds);

      const map = new Map<string, { studentId: string; recordId: string }>();
      ((recordsData as { id: string; student_id: string; quiz_id: string }[]) || []).forEach(r => {
        if (r.quiz_id) {
          map.set(r.quiz_id, { studentId: r.student_id, recordId: r.id });
        }
      });
      setWinnersByQuiz(map);
    }

    setIsLoading(false);
  }, [churchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 정답 공개
  const handleRevealAnswer = () => setShowAnswer(true);

  // 현재 퀴즈의 정답자
  const currentWinner = currentQuiz ? winnersByQuiz.get(currentQuiz.id) ?? null : null;

  // 다음 퀴즈
  const goToNext = () => {
    if (currentIndex >= quizzes.length - 1) return;
    setCurrentIndex(currentIndex + 1);
    setShowAnswer(false);
    setSearchTerm("");
  };

  // 이전 퀴즈
  const goToPrev = () => {
    if (currentIndex <= 0) return;
    setCurrentIndex(currentIndex - 1);
    setShowAnswer(false);
    setSearchTerm("");
  };

  // 정답자 선택 (문제당 한 명만)
  const handleAwardStudent = async (student: Student) => {
    if (!churchId || !user || !currentQuiz || isProcessing) return;
    if (currentWinner) return;  // 이미 선택됨 — 취소 후 다시 선택해야 함

    setIsProcessing(true);

    try {
      const seasonId = await getCurrentSeasonId(churchId);
      const newTalent = student.talent + TALENT_PER_CORRECT;

      const { error: updateError } = await supabase
        .from("students")
        .update({ talent: newTalent } as never)
        .eq("id", student.id);
      if (updateError) throw updateError;

      const { data: insertedRow, error: insertError } = await supabase
        .from("quest_records")
        .insert({
          student_id: student.id,
          church_id: churchId,
          type: "rps_quiz",
          date: new Date().toLocaleDateString("en-CA"),
          talent_earned: TALENT_PER_CORRECT,
          approved: true,
          approved_by: user.id,
          season_id: seasonId,
          quiz_id: currentQuiz.id,
        } as never)
        .select("id")
        .single();
      if (insertError) throw insertError;

      setStudents(prev =>
        prev.map(s => s.id === student.id ? { ...s, talent: newTalent } : s)
      );
      setWinnersByQuiz(prev => {
        const next = new Map(prev);
        next.set(currentQuiz.id, {
          studentId: student.id,
          recordId: (insertedRow as { id: string }).id,
        });
        return next;
      });
      setSearchTerm("");
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Error awarding talent:", error);
      alert("달란트 지급 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 정답자 선택 취소 (잘못 클릭 시)
  const handleCancelWinner = async () => {
    if (!currentWinner || !currentQuiz || isProcessing) return;
    const student = students.find(s => s.id === currentWinner.studentId);
    if (!student) return;

    if (!confirm(`${student.name}의 +${TALENT_PER_CORRECT} 달란트 지급을 취소할까요?`)) return;

    setIsProcessing(true);
    try {
      // 1. 학생 달란트 -1
      const newTalent = Math.max(0, student.talent - TALENT_PER_CORRECT);
      const { error: updateError } = await supabase
        .from("students")
        .update({ talent: newTalent } as never)
        .eq("id", student.id);
      if (updateError) throw updateError;

      // 2. quest_records row 삭제
      const { error: deleteError } = await supabase
        .from("quest_records")
        .delete()
        .eq("id", currentWinner.recordId);
      if (deleteError) throw deleteError;

      setStudents(prev =>
        prev.map(s => s.id === student.id ? { ...s, talent: newTalent } : s)
      );
      setWinnersByQuiz(prev => {
        const next = new Map(prev);
        next.delete(currentQuiz.id);
        return next;
      });
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error cancelling winner:", error);
      alert("취소 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Hand className="w-6 h-6 text-google-red" /> 가위바위보 퀴즈
        </h2>
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
          <p className="text-gray-500 mt-4 font-bold">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Hand className="w-6 h-6 text-google-red" /> 가위바위보 퀴즈
        </h2>
        <Card className="rounded-2xl shadow-md">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Hand className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-bold mb-2">등록된 퀴즈가 없습니다</p>
            <p className="text-gray-400 text-sm">퀴즈 관리에서 가위바위보 탭에 퀴즈를 추가해주세요.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-white p-4 overflow-y-auto" : ""} space-y-4 sm:space-y-6`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
          <Hand className="w-5 h-5 sm:w-6 sm:h-6 text-google-red" />
          가위바위보 퀴즈
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="text-xs"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </Button>
      </div>

      {/* 퀴즈 표시 영역 */}
      <Card className="rounded-2xl shadow-lg border-2 border-google-red/30">
        <CardContent className="p-4 sm:p-8">
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-4">
            <span className="font-bold">
              문제 {currentIndex + 1} / {quizzes.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-google-red/10 text-google-red rounded-full font-bold">
                {currentQuiz.quiz_type === "short_answer" ? "주관식" : "객관식"}
              </span>
            </div>
          </div>

          {/* 문제 */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-4 sm:p-8 mb-6">
            <p className="text-lg sm:text-3xl font-black text-gray-800 text-center break-words">
              {currentQuiz.question}
            </p>
          </div>

          {/* 보기 (객관식) */}
          {currentQuiz.quiz_type === "multiple_choice" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[currentQuiz.option1, currentQuiz.option2, currentQuiz.option3, currentQuiz.option4].map((option, idx) => {
                const isCorrect = showAnswer && idx + 1 === currentQuiz.correct_answer;
                return (
                  <div
                    key={idx}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      isCorrect
                        ? "bg-google-green/20 border-google-green"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-sm sm:text-base ${
                        isCorrect ? "bg-google-green text-white" : "bg-gray-200 text-gray-600"
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`text-sm sm:text-lg font-bold ${
                        isCorrect ? "text-google-green" : "text-gray-700"
                      }`}>
                        {option}
                      </span>
                      {isCorrect && <Check className="w-5 h-5 text-google-green ml-auto" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 정답 (주관식) */}
          {currentQuiz.quiz_type === "short_answer" && showAnswer && (
            <div className="bg-google-green/10 border-2 border-google-green rounded-xl p-4 mb-6 text-center">
              <p className="text-xs text-gray-500 font-bold mb-1">정답</p>
              <p className="text-xl sm:text-2xl font-black text-google-green">
                {currentQuiz.correct_answer_text}
              </p>
            </div>
          )}

          {/* 컨트롤 */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              variant="secondary"
              className="sm:flex-shrink-0 flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> 이전
            </Button>
            {!showAnswer ? (
              <Button
                onClick={handleRevealAnswer}
                variant="yellow"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                정답 공개
              </Button>
            ) : (
              <div className="flex-1 bg-google-green/10 border-2 border-google-green rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-google-green font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                {currentWinner ? "정답자 선택 완료 — 다음 문제로!" : "정답자 한 명을 선택하세요"}
              </div>
            )}
            <Button
              onClick={goToNext}
              disabled={currentIndex >= quizzes.length - 1}
              variant="secondary"
              className="sm:flex-shrink-0 flex items-center justify-center gap-1"
            >
              다음 <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 학생 선택 */}
      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-google-blue" />
              정답자 선택
              <span className="text-xs text-gray-500 font-normal">(문제당 1명)</span>
            </h3>
          </div>

          {/* 정답자가 이미 선택된 경우 - 정답자 표시 + 취소 */}
          {currentWinner ? (
            (() => {
              const winnerStudent = students.find(s => s.id === currentWinner.studentId);
              if (!winnerStudent) return null;
              return (
                <div className="bg-google-green/10 border-2 border-google-green rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-google-green rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-bold">정답자</p>
                      <p className="text-lg font-black text-gray-800 truncate">{winnerStudent.name}</p>
                      <p className="text-xs text-google-green font-bold">
                        +{TALENT_PER_CORRECT} 달란트 지급됨 (잔액 {winnerStudent.talent})
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCancelWinner}
                    disabled={isProcessing}
                    className="text-xs flex-shrink-0"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        취소
                      </>
                    )}
                  </Button>
                </div>
              );
            })()
          ) : (
            <>
              {/* 검색 드롭다운 */}
              <div ref={dropdownRef} className="relative">
                <div className={`relative ${!showAnswer ? "opacity-50 pointer-events-none" : ""}`}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsDropdownOpen(true);
                      setHighlightedIndex(0);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (!isDropdownOpen) return;
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setHighlightedIndex(prev => Math.min(prev + 1, filteredStudents.length - 1));
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setHighlightedIndex(prev => Math.max(prev - 1, 0));
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        const target = filteredStudents[highlightedIndex];
                        if (target) handleAwardStudent(target);
                      } else if (e.key === "Escape") {
                        setIsDropdownOpen(false);
                      }
                    }}
                    disabled={!showAnswer || isProcessing}
                    placeholder={showAnswer ? "학생 이름 입력 후 클릭 또는 Enter..." : "정답 공개 후 활성화됩니다"}
                    className="w-full pl-9 pr-9 py-2.5 border-2 border-gray-200 rounded-xl focus:border-google-red outline-none text-sm font-bold"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setHighlightedIndex(0);
                        inputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* 드롭다운 목록 */}
                {isDropdownOpen && showAnswer && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto z-20">
                    {filteredStudents.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {students.length === 0 ? "등록된 학생이 없습니다." : "검색 결과가 없습니다."}
                      </div>
                    ) : (
                      filteredStudents.map((student, idx) => {
                        const isHighlighted = idx === highlightedIndex;
                        return (
                          <button
                            key={student.id}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            onClick={() => handleAwardStudent(student)}
                            disabled={isProcessing}
                            className={`w-full px-3 py-2.5 flex items-center justify-between gap-3 transition-colors text-left border-b border-gray-100 last:border-b-0 ${
                              isHighlighted ? "bg-google-red/10" : "hover:bg-gray-50"
                            }`}
                          >
                            <span className="font-bold text-sm text-gray-800 truncate">
                              {student.name}
                            </span>
                            <span className="text-xs text-google-yellow font-bold flex items-center gap-0.5 flex-shrink-0">
                              {student.talent}
                              <Coins className="w-3 h-3" />
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {!showAnswer && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  정답 공개 후 학생 이름을 입력하면 검색 → 선택하면 +1 달란트 즉시 지급
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
