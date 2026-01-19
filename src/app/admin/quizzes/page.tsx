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
  Sparkles,
  MessageSquare,
  List,
  GripVertical
} from "lucide-react";

type QuizType = "multiple_choice" | "short_answer";

interface BibleDiceQuiz {
  id: string;
  church_id: string;
  quiz_type: QuizType;
  question: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  option4: string | null;
  correct_answer: number | null; // 1-4
  correct_answer_text: string | null;
  is_active: boolean;
  created_at: string;
  order_index: number;
}

export default function QuizzesPage() {
  const { churchId } = useAuth();
  const [quizzes, setQuizzes] = useState<BibleDiceQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<BibleDiceQuiz | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 폼 상태
  const [quizType, setQuizType] = useState<QuizType>("multiple_choice");
  const [question, setQuestion] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState(1);
  const [correctAnswerText, setCorrectAnswerText] = useState("");

  // 드래그 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // 퀴즈 목록 로드
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!churchId) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from("bible_dice_quizzes")
        .select("*")
        .eq("church_id", churchId)
        .order("order_index", { ascending: true });

      if (!error && data) {
        setQuizzes(data as BibleDiceQuiz[]);
      }
      setIsLoading(false);
    };

    fetchQuizzes();
  }, [churchId]);

  // 폼 초기화
  const resetForm = () => {
    setQuizType("multiple_choice");
    setQuestion("");
    setOption1("");
    setOption2("");
    setOption3("");
    setOption4("");
    setCorrectAnswer(1);
    setCorrectAnswerText("");
    setEditingQuiz(null);
    setShowForm(false);
  };

  // 퀴즈 편집 시작
  const startEditing = (quiz: BibleDiceQuiz) => {
    setEditingQuiz(quiz);
    setQuizType(quiz.quiz_type || "multiple_choice");
    setQuestion(quiz.question);
    setOption1(quiz.option1 || "");
    setOption2(quiz.option2 || "");
    setOption3(quiz.option3 || "");
    setOption4(quiz.option4 || "");
    setCorrectAnswer(quiz.correct_answer || 1);
    setCorrectAnswerText(quiz.correct_answer_text || "");
    setShowForm(true);
  };

  // 퀴즈 저장
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;

    // 유효성 검사
    if (!question.trim()) {
      alert("문제를 입력해주세요.");
      return;
    }

    if (quizType === "multiple_choice") {
      if (!option1.trim() || !option2.trim() || !option3.trim() || !option4.trim()) {
        alert("모든 보기를 입력해주세요.");
        return;
      }
    } else {
      if (!correctAnswerText.trim()) {
        alert("정답을 입력해주세요.");
        return;
      }
    }

    setIsSaving(true);

    try {
      const quizData = quizType === "multiple_choice"
        ? {
            quiz_type: "multiple_choice" as QuizType,
            question,
            option1,
            option2,
            option3,
            option4,
            correct_answer: correctAnswer,
            correct_answer_text: null,
          }
        : {
            quiz_type: "short_answer" as QuizType,
            question,
            option1: null,
            option2: null,
            option3: null,
            option4: null,
            correct_answer: null,
            correct_answer_text: correctAnswerText,
          };

      if (editingQuiz) {
        // 수정
        const { error } = await supabase
          .from("bible_dice_quizzes")
          .update(quizData as never)
          .eq("id", editingQuiz.id);

        if (error) throw error;

        setQuizzes(prev => prev.map(q =>
          q.id === editingQuiz.id
            ? { ...q, ...quizData }
            : q
        ));
      } else {
        // 새로 추가
        const { data, error } = await supabase
          .from("bible_dice_quizzes")
          .insert([{
            church_id: churchId,
            ...quizData,
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

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 드롭 처리 및 순서 저장
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      handleDragEnd();
      return;
    }

    setIsReordering(true);

    // 새 순서 배열 생성
    const newQuizzes = [...quizzes];
    const [draggedQuiz] = newQuizzes.splice(draggedIndex, 1);
    newQuizzes.splice(dropIndex, 0, draggedQuiz);

    // order_index 업데이트
    const updatedQuizzes = newQuizzes.map((quiz, idx) => ({
      ...quiz,
      order_index: idx + 1,
    }));

    setQuizzes(updatedQuizzes);
    handleDragEnd();

    // DB에 순서 저장
    try {
      const updates = updatedQuizzes.map((quiz) =>
        supabase
          .from("bible_dice_quizzes")
          .update({ order_index: quiz.order_index } as never)
          .eq("id", quiz.id)
      );
      await Promise.all(updates);
    } catch (error) {
      console.error("Error updating order:", error);
      alert("순서 저장 중 오류가 발생했습니다.");
    } finally {
      setIsReordering(false);
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
              {/* 퀴즈 타입 선택 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  퀴즈 유형
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQuizType("multiple_choice")}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      quizType === "multiple_choice"
                        ? "bg-google-blue text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <List className="w-4 h-4" />
                    객관식 (4지선다)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizType("short_answer")}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      quizType === "short_answer"
                        ? "bg-google-blue text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    주관식
                  </button>
                </div>
              </div>

              {/* 문제 입력 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <HelpCircle className="w-4 h-4 inline mr-1" />
                  문제
                </label>
                <Input
                  placeholder={quizType === "multiple_choice"
                    ? "예: 노아의 방주에 들어간 동물은 몇 쌍씩일까요?"
                    : "예: 예수님의 열두 제자 중 세리였던 사람은?"}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                />
              </div>

              {/* 객관식: 보기 입력 */}
              {quizType === "multiple_choice" && (
                <>
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
                </>
              )}

              {/* 주관식: 정답 입력 */}
              {quizType === "short_answer" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Check className="w-4 h-4 inline mr-1" />
                    정답
                  </label>
                  <Input
                    placeholder="예: 마태"
                    value={correctAnswerText}
                    onChange={(e) => setCorrectAnswerText(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    게임 중 정답 공개 버튼을 누르면 표시됩니다.
                  </p>
                </div>
              )}

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
              {isReordering && (
                <div className="text-center py-2 text-sm text-google-blue font-bold">
                  <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                  순서 저장 중...
                </div>
              )}
              {quizzes.map((quiz, index) => (
                <li
                  key={quiz.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-move ${
                    quiz.is_active
                      ? "bg-white border-google-blue/30 shadow-sm"
                      : "bg-gray-50 border-gray-200 opacity-60"
                  } ${draggedIndex === index ? "opacity-50 scale-95" : ""} ${
                    dragOverIndex === index && draggedIndex !== index
                      ? "border-google-blue border-dashed"
                      : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {/* 드래그 핸들 및 순서 번호 */}
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
                          {index + 1}
                        </span>
                      </div>
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
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                            quiz.quiz_type === "short_answer"
                              ? "bg-purple-100 text-purple-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {quiz.quiz_type === "short_answer" ? "주관식" : "객관식"}
                        </span>
                      </div>
                      <p className="font-bold text-gray-800 text-sm sm:text-base mb-2 break-words">
                        {quiz.question}
                      </p>
                      {quiz.quiz_type === "short_answer" ? (
                        <div className="bg-purple-50 rounded-lg px-3 py-2">
                          <span className="text-xs text-gray-500">정답: </span>
                          <span className="text-sm font-bold text-purple-700">{quiz.correct_answer_text}</span>
                        </div>
                      ) : (
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
                      )}
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
