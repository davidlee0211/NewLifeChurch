"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const mockStudents = [
  { id: 1, name: "김민준", team: "믿음팀", talent: 180 },
  { id: 2, name: "이서연", team: "믿음팀", talent: 150 },
  { id: 3, name: "박지훈", team: "사랑팀", talent: 120 },
  { id: 4, name: "최수아", team: "소망팀", talent: 100 },
  { id: 5, name: "정예준", team: "사랑팀", talent: 200 },
];

export default function TalentPage() {
  const [selectedStudent, setSelectedStudent] = useState<typeof mockStudents[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleGiveTalent = () => {
    if (!selectedStudent || !amount || !reason) {
      alert("모든 필드를 입력해주세요.");
      return;
    }
    alert(`${selectedStudent.name}에게 ${amount} 달란트가 지급되었습니다.`);
    setAmount("");
    setReason("");
  };

  const handleTakeTalent = () => {
    if (!selectedStudent || !amount || !reason) {
      alert("모든 필드를 입력해주세요.");
      return;
    }
    alert(`${selectedStudent.name}의 ${amount} 달란트가 차감되었습니다.`);
    setAmount("");
    setReason("");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">달란트 관리</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>학생 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {mockStudents.map((student) => (
                <li
                  key={student.id}
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedStudent?.id === student.id
                      ? "bg-blue-50 border-2 border-google-blue"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div>
                    <p className="font-medium text-gray-800">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.team}</p>
                  </div>
                  <span className="font-semibold text-google-blue">{student.talent} 달란트</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>달란트 지급/차감</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStudent ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-500">선택된 학생</p>
                  <p className="text-xl font-bold text-gray-800">{selectedStudent.name}</p>
                  <p className="text-google-blue">현재 잔액: {selectedStudent.talent} 달란트</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    달란트 수량
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="숫자 입력"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사유
                  </label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="지급/차감 사유를 입력하세요"
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleGiveTalent} className="flex-1">
                    지급
                  </Button>
                  <Button variant="red" onClick={handleTakeTalent} className="flex-1">
                    차감
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                왼쪽 목록에서 학생을 선택하세요.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 달란트 거래 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">학생</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">유형</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">금액</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">사유</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">날짜</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">김민준</td>
                <td className="py-3 px-4">
                  <span className="text-green-600">지급</span>
                </td>
                <td className="py-3 px-4 font-medium text-green-600">+20</td>
                <td className="py-3 px-4">QT 승인</td>
                <td className="py-3 px-4 text-gray-500">2024-01-07</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">이서연</td>
                <td className="py-3 px-4">
                  <span className="text-green-600">지급</span>
                </td>
                <td className="py-3 px-4 font-medium text-green-600">+10</td>
                <td className="py-3 px-4">출석</td>
                <td className="py-3 px-4 text-gray-500">2024-01-07</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">박지훈</td>
                <td className="py-3 px-4">
                  <span className="text-red-600">차감</span>
                </td>
                <td className="py-3 px-4 font-medium text-red-600">-5</td>
                <td className="py-3 px-4">규칙 위반</td>
                <td className="py-3 px-4 text-gray-500">2024-01-06</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
