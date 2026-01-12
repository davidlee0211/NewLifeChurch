"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const mockQTSubmissions = [
  {
    id: 1,
    studentName: "김민준",
    title: "창세기 1장 묵상",
    content: "하나님께서 천지를 창조하신 말씀을 통해 하나님의 능력과 계획하심을 느꼈습니다...",
    submittedAt: "2024-01-07 09:30",
    status: "pending",
  },
  {
    id: 2,
    studentName: "이서연",
    title: "시편 23편 묵상",
    content: "여호와는 나의 목자시니 내게 부족함이 없으리로다...",
    submittedAt: "2024-01-07 10:15",
    status: "pending",
  },
  {
    id: 3,
    studentName: "박지훈",
    title: "요한복음 3장 16절 묵상",
    content: "하나님이 세상을 이처럼 사랑하사...",
    submittedAt: "2024-01-06 14:20",
    status: "pending",
  },
];

export default function QTApprovalPage() {
  const [submissions, setSubmissions] = useState(mockQTSubmissions);
  const [selectedQT, setSelectedQT] = useState<typeof mockQTSubmissions[0] | null>(null);

  const handleApprove = (id: number) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    setSelectedQT(null);
    alert("QT가 승인되었습니다. 달란트가 지급됩니다.");
  };

  const handleReject = (id: number) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    setSelectedQT(null);
    alert("QT가 반려되었습니다.");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">QT 승인</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>승인 대기 목록 ({submissions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">승인 대기 중인 QT가 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {submissions.map((qt) => (
                  <li
                    key={qt.id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedQT?.id === qt.id
                        ? "bg-blue-50 border-2 border-google-blue"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedQT(qt)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{qt.title}</p>
                        <p className="text-sm text-gray-500">{qt.studentName}</p>
                      </div>
                      <span className="text-xs text-gray-400">{qt.submittedAt}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QT 상세</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedQT ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">제출자</p>
                  <p className="font-medium">{selectedQT.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">제목</p>
                  <p className="font-medium">{selectedQT.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">내용</p>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {selectedQT.content}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">제출 시간</p>
                  <p className="font-medium">{selectedQT.submittedAt}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => handleApprove(selectedQT.id)}
                    className="flex-1"
                  >
                    승인 (+20 달란트)
                  </Button>
                  <Button
                    variant="red"
                    onClick={() => handleReject(selectedQT.id)}
                    className="flex-1"
                  >
                    반려
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                왼쪽 목록에서 QT를 선택하세요.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
