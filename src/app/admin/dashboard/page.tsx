"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800">관리자 대시보드 👑</h2>
        <p className="text-gray-500 mt-1 font-semibold">오늘의 주일학교 현황을 확인하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card hover className="border-l-4 border-l-google-blue">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-bold">총 학생 수</p>
                <p className="text-3xl font-black text-gray-800 mt-1">24</p>
              </div>
              <div className="w-12 h-12 bg-google-blue/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👨‍🎓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover className="border-l-4 border-l-google-green">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-bold">오늘 출석</p>
                <p className="text-3xl font-black text-google-green mt-1">18</p>
              </div>
              <div className="w-12 h-12 bg-google-green/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover className="border-l-4 border-l-google-red">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-bold">승인 대기 QT</p>
                <p className="text-3xl font-black text-google-red mt-1">5</p>
              </div>
              <div className="w-12 h-12 bg-google-red/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📖</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="yellow" hover>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-bold">총 달란트 발행</p>
                <p className="text-3xl font-black text-gray-800 mt-1">3,650</p>
              </div>
              <div className="w-12 h-12 bg-white/50 rounded-lg flex items-center justify-center">
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
                <span className="w-20 text-sm font-bold flex items-center gap-1">
                  <span className="w-3 h-3 bg-google-red rounded-full"></span>
                  사랑팀
                </span>
                <div className="flex-1 bg-gray-100 rounded-lg h-5 overflow-hidden">
                  <div className="bg-google-red h-full rounded-lg" style={{ width: "75%" }} />
                </div>
                <span className="text-sm font-bold text-gray-700 w-16 text-right">620 🪙</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="w-20 text-sm font-bold flex items-center gap-1">
                  <span className="w-3 h-3 bg-google-blue rounded-full"></span>
                  믿음팀
                </span>
                <div className="flex-1 bg-gray-100 rounded-lg h-5 overflow-hidden">
                  <div className="bg-google-blue h-full rounded-lg" style={{ width: "65%" }} />
                </div>
                <span className="text-sm font-bold text-gray-700 w-16 text-right">550 🪙</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="w-20 text-sm font-bold flex items-center gap-1">
                  <span className="w-3 h-3 bg-google-green rounded-full"></span>
                  소망팀
                </span>
                <div className="flex-1 bg-gray-100 rounded-lg h-5 overflow-hidden">
                  <div className="bg-google-green h-full rounded-lg" style={{ width: "55%" }} />
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
              <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-google-green/20 rounded-lg flex items-center justify-center">
                    <span>✅</span>
                  </div>
                  <span className="text-gray-700 font-bold">김민준 - 출석 체크</span>
                </div>
                <span className="text-sm text-gray-400 bg-white px-2 py-1 rounded-lg font-semibold">5분 전</span>
              </li>
              <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-google-red/20 rounded-lg flex items-center justify-center">
                    <span>📖</span>
                  </div>
                  <span className="text-gray-700 font-bold">이서연 - QT 제출</span>
                </div>
                <span className="text-sm text-gray-400 bg-white px-2 py-1 rounded-lg font-semibold">10분 전</span>
              </li>
              <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-google-blue/20 rounded-lg flex items-center justify-center">
                    <span>❓</span>
                  </div>
                  <span className="text-gray-700 font-bold">박지훈 - 퀴즈 정답</span>
                </div>
                <span className="text-sm text-gray-400 bg-white px-2 py-1 rounded-lg font-semibold">15분 전</span>
              </li>
              <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-google-yellow/30 rounded-lg flex items-center justify-center">
                    <span>📖</span>
                  </div>
                  <span className="text-gray-700 font-bold">최수아 - QT 제출</span>
                </div>
                <span className="text-sm text-gray-400 bg-white px-2 py-1 rounded-lg font-semibold">20분 전</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
