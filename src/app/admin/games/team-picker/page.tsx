"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const allStudents = [
  "김민준", "이서연", "박지훈", "최수아", "정예준",
  "강하늘", "윤서준", "임지우", "한소희", "송민서",
];

export default function TeamPickerPage() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const pickRandomStudent = () => {
    setIsSpinning(true);
    setSelectedStudent(null);

    // 스피닝 효과
    let count = 0;
    const maxCount = 20;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * allStudents.length);
      setSelectedStudent(allStudents[randomIndex]);
      count++;

      if (count >= maxCount) {
        clearInterval(interval);
        const finalIndex = Math.floor(Math.random() * allStudents.length);
        const finalStudent = allStudents[finalIndex];
        setSelectedStudent(finalStudent);
        setHistory((prev) => [finalStudent, ...prev.slice(0, 9)]);
        setIsSpinning(false);
      }
    }, 100);
  };

  const clearHistory = () => {
    setHistory([]);
    setSelectedStudent(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">팀 뽑기</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>랜덤 학생 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`w-64 h-64 mx-auto rounded-xl bg-google-blue border-b-4 border-blue-700 flex items-center justify-center mb-6 shadow-roblox ${
                isSpinning ? "animate-pulse" : ""
              }`}
            >
              <span className="text-4xl font-bold text-white">
                {selectedStudent || "?"}
              </span>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={pickRandomStudent}
                disabled={isSpinning}
                size="lg"
              >
                {isSpinning ? "선택 중..." : "뽑기!"}
              </Button>
              <Button variant="secondary" onClick={clearHistory}>
                초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>뽑기 기록</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                아직 뽑기 기록이 없습니다.
              </p>
            ) : (
              <ul className="space-y-2">
                {history.map((name, index) => (
                  <li
                    key={index}
                    className={`p-3 rounded-lg flex items-center gap-3 ${
                      index === 0 ? "bg-blue-50 border-2 border-google-blue" : "bg-gray-50"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                        index === 0
                          ? "bg-google-blue text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className={index === 0 ? "font-bold" : ""}>{name}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>전체 학생 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allStudents.map((student) => (
              <span
                key={student}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  history.includes(student)
                    ? "bg-blue-100 text-google-blue"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {student}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
