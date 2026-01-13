"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Settings, Coins, Users, Database, User, Pencil } from "lucide-react";

export default function SettingsPage() {
  const [attendanceTalent, setAttendanceTalent] = useState("10");
  const [qtTalent, setQtTalent] = useState("20");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
        <Settings className="w-6 h-6 text-gray-600" />
        설정
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-google-yellow" />
              달란트 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
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
                <label className="block text-sm font-bold text-gray-700 mb-2">
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

              <Button className="rounded-xl shadow-md hover:shadow-lg transition-all">설정 저장</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-google-blue" />
              팀 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-4">
              <li className="flex items-center justify-between p-3 bg-google-red/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-google-red" />
                  <span className="font-bold">사랑팀</span>
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl">
                  <Pencil className="w-4 h-4" />
                </Button>
              </li>
              <li className="flex items-center justify-between p-3 bg-google-blue/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-google-blue" />
                  <span className="font-bold">믿음팀</span>
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl">
                  <Pencil className="w-4 h-4" />
                </Button>
              </li>
              <li className="flex items-center justify-between p-3 bg-google-green/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-google-green" />
                  <span className="font-bold">소망팀</span>
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl">
                  <Pencil className="w-4 h-4" />
                </Button>
              </li>
            </ul>
            <Button variant="secondary" className="w-full rounded-xl">새 팀 추가</Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-google-green" />
              데이터 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="secondary" className="w-full rounded-xl shadow-sm hover:shadow-md transition-all">
                달란트 기록 내보내기 (CSV)
              </Button>
              <Button variant="secondary" className="w-full rounded-xl shadow-sm hover:shadow-md transition-all">
                출석 기록 내보내기 (CSV)
              </Button>
              <Button variant="red" className="w-full rounded-xl shadow-md hover:shadow-lg transition-all">
                이번 학기 데이터 초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              계정 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  관리자 이름
                </label>
                <Input defaultValue="김교사" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  이메일
                </label>
                <Input type="email" defaultValue="teacher@church.com" />
              </div>
              <Button className="rounded-xl shadow-md hover:shadow-lg transition-all">계정 정보 수정</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
