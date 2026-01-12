"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

const mockStudents = [
  { id: 1, name: "김민준", team: "믿음팀", talent: 180, attendance: 95 },
  { id: 2, name: "이서연", team: "믿음팀", talent: 150, attendance: 90 },
  { id: 3, name: "박지훈", team: "사랑팀", talent: 120, attendance: 85 },
  { id: 4, name: "최수아", team: "소망팀", talent: 100, attendance: 88 },
  { id: 5, name: "정예준", team: "사랑팀", talent: 200, attendance: 100 },
];

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = mockStudents.filter((student) =>
    student.name.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">학생 관리</h2>
        <Button>학생 추가</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <Input
              placeholder="학생 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">이름</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">팀</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">달란트</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">출석률</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-3 px-4">{student.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-google-blue rounded-full">
                      {student.team}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-google-blue">{student.talent}</td>
                  <td className="py-3 px-4">{student.attendance}%</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm">수정</Button>
                    <Button variant="ghost" size="sm" className="text-red-600">삭제</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
