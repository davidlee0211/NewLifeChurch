"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const mockStudents = [
  { id: 1, name: "김민준", team: "믿음팀", isPresent: false },
  { id: 2, name: "이서연", team: "믿음팀", isPresent: false },
  { id: 3, name: "박지훈", team: "사랑팀", isPresent: false },
  { id: 4, name: "최수아", team: "소망팀", isPresent: false },
  { id: 5, name: "정예준", team: "사랑팀", isPresent: false },
];

export default function AttendancePage() {
  const [students, setStudents] = useState(mockStudents);
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const toggleAttendance = (id: number) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, isPresent: !student.isPresent } : student
      )
    );
  };

  const presentCount = students.filter((s) => s.isPresent).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>✅</span> 출석 체크
          </h2>
          <p className="text-gray-500 mt-1">{today}</p>
        </div>
        <Button size="lg">
          <span className="flex items-center gap-2">
            출석 저장
            <span>💾</span>
          </span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hover className="border-l-4 border-l-success">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto bg-success/20 rounded-2xl flex items-center justify-center mb-2">
                <span className="text-2xl">😊</span>
              </div>
              <p className="text-4xl font-bold text-success">{presentCount}</p>
              <p className="text-gray-500 font-medium">출석</p>
            </div>
          </CardContent>
        </Card>
        <Card hover className="border-l-4 border-l-error">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto bg-error/20 rounded-2xl flex items-center justify-center mb-2">
                <span className="text-2xl">😢</span>
              </div>
              <p className="text-4xl font-bold text-error">{students.length - presentCount}</p>
              <p className="text-gray-500 font-medium">결석</p>
            </div>
          </CardContent>
        </Card>
        <Card hover className="border-l-4 border-l-accent">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto bg-accent/20 rounded-2xl flex items-center justify-center mb-2">
                <span className="text-2xl">👨‍🎓</span>
              </div>
              <p className="text-4xl font-bold text-gray-800">{students.length}</p>
              <p className="text-gray-500 font-medium">전체</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📋</span> 학생 목록
            <span className="text-sm font-normal text-gray-400 ml-2">클릭하여 출석 체크</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {students.map((student) => (
              <li
                key={student.id}
                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                  student.isPresent
                    ? "bg-success/10 border-2 border-success/30 shadow-sm"
                    : "bg-background-alt hover:bg-background-alt/80 border-2 border-transparent"
                }`}
                onClick={() => toggleAttendance(student.id)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      student.isPresent
                        ? "bg-success text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    {student.isPresent ? (
                      <span className="text-xl">✓</span>
                    ) : (
                      <span className="text-gray-400 text-xl">○</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.team}</p>
                  </div>
                </div>
                <span
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                    student.isPresent
                      ? "bg-success text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {student.isPresent ? "출석 ✓" : "결석"}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
