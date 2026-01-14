"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  Dices,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  HelpCircle,
  Sparkles
} from "lucide-react";

interface BibleDiceQuiz {
  id: string;
  church_id: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_answer: number; // 1-4
  is_active: boolean;
  created_at: string;
}

export default function QuizzesPage() {
  const { churchId } = useAuth();
  const [quizzes, setQuizzes] = useState<BibleDiceQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<BibleDiceQuiz | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 폼 상태
  const [question, setQuestion] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState(1);

  // 퀴즈 목록 로드
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!churchId) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from("bible_dice_quizzes")
        .select("*")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setQuizzes(data as BibleDiceQuiz[]);
      }
      setIsLoading(false);
    };

    fetchQuizzes();
  }, [churchId]);

  // 폼 초기화
  const resetForm = () => {
    setQuestion("");
    setOption1("");
    setOption2("");
    setOption3("");
    setOption4("");
    setCorrectAnswer(1);
    setEditingQuiz(null);
    setShowForm(false);
  };

  // 퀴즈 편집 시작
  const startEditing = (quiz: BibleDiceQuiz) => {
    setEditingQuiz(quiz);
    setQuestion(quiz.question);
    setOption1(quiz.option1);
    setOption2(quiz.option2);
    setOption3(quiz.option3);
    setOption4(quiz.option4);
    setCorrectAnswer(quiz.correct_answer);
    setShowForm(true);
  };

  // 퀴즈 저장
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;

    if (!question.trim() || !option1.trim() || !option2.trim() || !option3.trim() || !option4.trim()) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingQuiz) {
        // 수정
        const { error } = await supabase
          .from("bible_dice_quizzes")
          .update({
            question,
            option1,
            option2,
            option3,
            option4,
            correct_answer: correctAnswer,
          } as never)
          .eq("id", editingQuiz.id);

        if (error) throw error;

        setQuizzes(prev => prev.map(q =>
          q.id === editingQuiz.id
            ? { ...q, question, option1, option2, option3, option4, correct_answer: correctAnswer }
            : q
        ));
      } else {
        // 새로 추가
        const { data, error } = await supabase
          .from("bible_dice_quizzes")
          .insert([{
            church_id: churchId,
            question,
            option1,
            option2,
            option3,
            option4,
            correct_answer: correctAnswer,
            is_active: true,
          }] as never)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setQuizzes(prev => [data as BibleDiceQuiz, ...prev]);
        }
      }

      resetForm();
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 퀴즈 활성/비활성 토글
  const toggleActive = async (quiz: BibleDiceQuiz) => {
    const { error } = await supabase
      .from("bible_dice_quizzes")
      .update({ is_active: !quiz.is_active } as never)
      .eq("id", quiz.id);

    if (!error) {
      setQuizzes(prev => prev.map(q =>
        q.id === quiz.id ? { ...q, is_active: !q.is_active } : q
      ));
    }
  };

  // 퀴즈 삭제
  const handleDelete = async (quiz: BibleDiceQuiz) => {
    if (!confirm("이 퀴즈를 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from("bible_dice_quizzes")
      .delete()
      .eq("id", quiz.id);

    if (!error) {
      setQuizzes(prev => prev.filter(q => q.id !== quiz.id));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Dices className="w-6 h-6 text-google-blue" />
          바이블다이스 퀴즈 관리
        </h2>
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 mx-auto text-gray-400 animate-spin" />
          <p className="text-gray-500 mt-4 font-bold">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Dices className="w-5 h-5 sm:w-6 sm:h-6 text-google-blue" />
          <span className="hidden sm:inline">바이블다이스 퀴즈 관리</span>
          <span className="sm:hidden">퀴즈 관리</span>
        </h2>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="text-xs sm:text-sm">
          {showForm ? (
            <>
              <X className="w-4 h-4 mr-1" />
              취소
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">새 퀴즈 추가</span>
              <span className="sm:hidden">추가</span>
            </>
          )}
        </Button>
      </div>

      {/* 퀴즈 추가/수정 폼 */}
      {showForm && (
        <Card className="rounded-2xl shadow-lg border-2 border-google-blue">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="w-5 h-5 text-google-yellow" />
              {editingQuiz ? "퀴즈 수정" : "새 퀴즈 만들기"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <HelpCircle className="w-4 h-4 inline mr-1" />
                  문제
                </label>
                <Input
                  placeholder="예: 노아의 방주에 들어간 동물은 몇 쌍씩일까요?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  보기 (4지선다)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        correctAnswer === num
                          ? "bg-google-green text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}>
                        {num}
                      </span>
                      <Input
                        placeholder={`보기 ${num}`}
                        className="pl-12"
                        value={num === 1 ? option1 : num === 2 ? option2 : num === 3 ? option3 : option4}
                        onChange={(e) => {
                          if (num === 1) setOption1(e.target.value);
                          else if (num === 2) setOption2(e.target.value);
                          else if (num === 3) setOption3(e.target.value);
                          else setOption4(e.target.value);
                        }}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  정답 선택
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCorrectAnswer(num)}
                      className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                        correctAnswer === num
                          ? "bg-google-green text-white shadow-lg scale-110"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {editingQuiz ? "수정 완료" : "퀴즈 저장"}
                    </>
                  )}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 퀴즈 목록 */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Dices className="w-5 h-5 text-google-blue" />
            퀴즈 목록 ({quizzes.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quizzes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <HelpCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-bold mb-2">등록된 퀴즈가 없습니다</p>
              <p className="text-gray-400 text-sm">새 퀴즈를 추가해서 바이블다이스 게임을 시작하세요!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {quizzes.map((quiz) => (
                <li
                  key={quiz.id}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all ${
                    quiz.is_active
                      ? "bg-white border-google-blue/30 shadow-sm"
                      : "bg-gray-50 border-gray-200 opacity-60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                            quiz.is_active
                              ? "bg-google-green/20 text-google-green"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {quiz.is_active ? "활성" : "비활성"}
                        </span>
                      </div>
                      <p className="font-bold text-gray-800 text-sm sm:text-base mb-2 break-words">
                        {quiz.question}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        {[quiz.option1, quiz.option2, quiz.option3, quiz.option4].map((option, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs sm:text-sm rounded-lg truncate ${
                              index + 1 === quiz.correct_answer
                                ? "bg-google-green/20 text-google-green font-bold border border-google-green"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {index + 1}. {option}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-1 sm:gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(quiz)}
                        className="text-xs px-2"
                      >
                        {quiz.is_active ? "비활성" : "활성화"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(quiz)}
                        className="text-xs px-2"
                      >
                        <Pencil className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">수정</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-google-red text-xs px-2"
                        onClick={() => handleDelete(quiz)}
                      >
                        <Trash2 className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">삭제</span>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
