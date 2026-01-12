"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const mockQuizzes = [
  { id: 1, question: "노아의 방주에 들어간 동물은 몇 쌍씩?", answer: "2쌍", points: 10 },
  { id: 2, question: "다윗이 골리앗을 쓰러뜨린 무기는?", answer: "물매", points: 20 },
  { id: 3, question: "예수님이 태어나신 마을은?", answer: "베들레헴", points: 10 },
  { id: 4, question: "열두 제자 중 예수님을 배반한 사람은?", answer: "가룟 유다", points: 30 },
];

export default function QuizBoardPage() {
  const [currentQuiz, setCurrentQuiz] = useState<typeof mockQuizzes[0] | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [usedQuizzes, setUsedQuizzes] = useState<number[]>([]);

  const selectQuiz = (quiz: typeof mockQuizzes[0]) => {
    if (usedQuizzes.includes(quiz.id)) return;
    setCurrentQuiz(quiz);
    setShowAnswer(false);
  };

  const revealAnswer = () => {
    setShowAnswer(true);
    if (currentQuiz) {
      setUsedQuizzes((prev) => [...prev, currentQuiz.id]);
    }
  };

  const resetGame = () => {
    setCurrentQuiz(null);
    setShowAnswer(false);
    setUsedQuizzes([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">퀴즈 보드</h2>
        <Button variant="secondary" onClick={resetGame}>
          게임 초기화
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mockQuizzes.map((quiz) => (
          <button
            key={quiz.id}
            onClick={() => selectQuiz(quiz)}
            disabled={usedQuizzes.includes(quiz.id)}
            className={`aspect-square rounded-xl font-bold text-2xl transition-all ${
              usedQuizzes.includes(quiz.id)
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : currentQuiz?.id === quiz.id
                ? "bg-indigo-600 text-white scale-105"
                : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-105"
            }`}
          >
            {quiz.points}점
          </button>
        ))}
      </div>

      {currentQuiz && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>문제 ({currentQuiz.points}점)</span>
              {showAnswer && (
                <span className="text-green-500 text-base font-normal">정답 공개됨</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-2xl font-medium text-gray-800 mb-8">
                {currentQuiz.question}
              </p>

              {showAnswer ? (
                <div className="space-y-4">
                  <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm text-green-600 mb-2">정답</p>
                    <p className="text-3xl font-bold text-green-700">{currentQuiz.answer}</p>
                  </div>
                  <Button onClick={() => setCurrentQuiz(null)}>
                    다음 문제 선택
                  </Button>
                </div>
              ) : (
                <Button onClick={revealAnswer} size="lg">
                  정답 보기
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {usedQuizzes.length === mockQuizzes.length && (
        <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
          <CardContent className="py-8 text-center">
            <p className="text-3xl font-bold mb-4">모든 문제 완료!</p>
            <Button variant="secondary" onClick={resetGame}>
              다시 시작
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
