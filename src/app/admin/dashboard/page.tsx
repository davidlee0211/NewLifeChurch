"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">관리자 대시보드 👑</h2>
        <p className="text-gray-500 mt-1">오늘의 주일학교 현황을 확인하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card hover className="border-l-4 border-l-accent">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">총 학생 수</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">24</p>
              </div>
              <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">👨‍🎓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover className="border-l-4 border-l-success">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">오늘 출석</p>
                <p className="text-3xl font-bold text-success mt-1">18</p>
              </div>
              <div className="w-12 h-12 bg-success/20 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">승인 대기 QT</p>
                <p className="text-3xl font-bold text-primary mt-1">5</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">📖</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gold" hover>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm font-medium">총 달란트 발행</p>
                <p className="text-3xl font-bold text-white mt-1">3,650</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🪙</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📊</span> 팀별 달란트 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-center gap-4">
                <span className="w-20 text-sm font-semibold flex items-center gap-1">
                  <span className="w-3 h-3 bg-error rounded-full"></span>
                  사랑팀
                </span>
                <div className="flex-1 bg-background-alt rounded-full h-5 overflow-hidden">
                  <div className="bg-gradient-to-r from-error/80 to-error h-full rounded-full" style={{ width: "75%" }} />
                </div>
                <span className="text-sm font-bold text-gray-700 w-16 text-right">620 🪙</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="w-20 text-sm font-semibold flex items-center gap-1">
                  <span className="w-3 h-3 bg-accent rounded-full"></span>
                  믿음팀
                </span>
                <div className="flex-1 bg-background-alt rounded-full h-5 overflow-hidden">
                  <div className="bg-gradient-to-r from-accent/80 to-accent h-full rounded-full" style={{ width: "65%" }} />
                </div>
                <span className="text-sm font-bold text-gray-700 w-16 text-right">550 🪙</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="w-20 text-sm font-semibold flex items-center gap-1">
                  <span className="w-3 h-3 bg-success rounded-full"></span>
                  소망팀
                </span>
                <div className="flex-1 bg-background-alt rounded-full h-5 overflow-hidden">
                  <div className="bg-gradient-to-r from-success/80 to-success h-full rounded-full" style={{ width: "55%" }} />
                </div>
                <span className="text-sm font-bold text-gray-700 w-16 text-right">480 🪙</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📝</span> 최근 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center justify-between p-3 bg-background-alt rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                    <span>✅</span>
                  </div>
                  <span className="text-gray-700 font-medium">김민준 - 출석 체크</span>
                </div>
                <span className="text-sm text-gray-400 bg-white px-2 py-1 rounded-full">5분 전</span>
              </li>
              <li className="flex items-center justify-between p-3 bg-background-alt rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                    <span>📖</span>
                  </div>
                  <span className="text-gray-700 font-medium">이서연 - QT 제출</span>
                </div>
                <span className="text-sm text-gray-400 bg-white px-2 py-1 rounded-full">10분 전</span>
              </li>
              <li className="flex items-center justify-between p-3 bg-background-alt rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <span>❓</span>
                  </div>
                  <span className="text-gray-700 font-medium">박지훈 - 퀴즈 정답</span>
                </div>
                <span className="text-sm text-gray-400 bg-white px-2 py-1 rounded-full">15분 전</span>
              </li>
              <li className="flex items-center justify-between p-3 bg-background-alt rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                    <span>📖</span>
                  </div>
                  <span className="text-gray-700 font-medium">최수아 - QT 제출</span>
                </div>
                <span className="text-sm text-gray-400 bg-white px-2 py-1 rounded-full">20분 전</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
