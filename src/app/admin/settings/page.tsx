"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function SettingsPage() {
  const [attendanceTalent, setAttendanceTalent] = useState("10");
  const [qtTalent, setQtTalent] = useState("20");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">설정</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>달란트 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출석 달란트
                </label>
                <Input
                  type="number"
                  value={attendanceTalent}
                  onChange={(e) => setAttendanceTalent(e.target.value)}
                  min="1"
                />
                <p className="text-sm text-gray-500 mt-1">출석 시 지급되는 달란트</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QT 승인 달란트
                </label>
                <Input
                  type="number"
                  value={qtTalent}
                  onChange={(e) => setQtTalent(e.target.value)}
                  min="1"
                />
                <p className="text-sm text-gray-500 mt-1">QT 승인 시 지급되는 달란트</p>
              </div>

              <Button>설정 저장</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>팀 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-4">
              <li className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span>사랑팀</span>
                </div>
                <Button variant="ghost" size="sm">수정</Button>
              </li>
              <li className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <span>믿음팀</span>
                </div>
                <Button variant="ghost" size="sm">수정</Button>
              </li>
              <li className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span>소망팀</span>
                </div>
                <Button variant="ghost" size="sm">수정</Button>
              </li>
            </ul>
            <Button variant="secondary" className="w-full">새 팀 추가</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>데이터 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="secondary" className="w-full">
                달란트 기록 내보내기 (CSV)
              </Button>
              <Button variant="secondary" className="w-full">
                출석 기록 내보내기 (CSV)
              </Button>
              <Button variant="red" className="w-full">
                이번 학기 데이터 초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>계정 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  관리자 이름
                </label>
                <Input defaultValue="김교사" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <Input type="email" defaultValue="teacher@church.com" />
              </div>
              <Button>계정 정보 수정</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
