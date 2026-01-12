"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const mockQuizzes = [
  {
    id: 1,
    title: "노아의 방주",
    question: "노아의 방주에 들어간 동물은 몇 쌍씩?",
    options: ["1쌍", "2쌍", "3쌍", "4쌍"],
    correctAnswer: 1,
    talentReward: 10,
    isActive: true,
  },
  {
    id: 2,
    title: "다윗과 골리앗",
    question: "다윗이 골리앗을 쓰러뜨린 무기는?",
    options: ["칼", "창", "물매", "활"],
    correctAnswer: 2,
    talentReward: 20,
    isActive: true,
  },
];

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState(mockQuizzes);
  const [showForm, setShowForm] = useState(false);

  const toggleActive = (id: number) => {
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === id ? { ...quiz, isActive: !quiz.isActive } : quiz
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">퀴즈 관리</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "취소" : "새 퀴즈 추가"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 퀴즈 만들기</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  퀴즈 제목
                </label>
                <Input placeholder="퀴즈 제목을 입력하세요" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문제
                </label>
                <Input placeholder="문제를 입력하세요" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  보기 (4개)
                </label>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((num) => (
                    <Input key={num} placeholder={`보기 ${num}`} />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    정답 번호 (1-4)
                  </label>
                  <Input type="number" min="1" max="4" placeholder="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    달란트 보상
                  </label>
                  <Input type="number" min="1" placeholder="10" />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit">저장</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>퀴즈 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {quizzes.map((quiz) => (
              <li
                key={quiz.id}
                className={`p-4 rounded-lg border ${
                  quiz.isActive ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-800">{quiz.title}</h4>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          quiz.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {quiz.isActive ? "활성" : "비활성"}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{quiz.question}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {quiz.options.map((option, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 text-sm rounded ${
                            index === quiz.correctAnswer
                              ? "bg-green-100 text-green-700 font-medium"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {index + 1}. {option}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-google-blue">보상: {quiz.talentReward} 달란트</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(quiz.id)}
                    >
                      {quiz.isActive ? "비활성화" : "활성화"}
                    </Button>
                    <Button variant="ghost" size="sm">
                      수정
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      삭제
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
