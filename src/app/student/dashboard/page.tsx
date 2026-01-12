"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">안녕하세요, 민준! 👋</h2>
          <p className="text-gray-500 mt-1">오늘도 하나님과 함께 멋진 하루 보내요!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="gold" hover>
          <CardHeader>
            <CardTitle className="text-white/90 flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              내 달란트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-white">150</p>
            <p className="text-sm text-white/70 mt-1">달란트</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/90 to-emerald-600 text-white" hover>
          <CardHeader>
            <CardTitle className="text-white/90 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              이번 주 출석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">4/4</p>
            <p className="text-sm text-white/70 mt-1">완벽해요!</p>
          </CardContent>
        </Card>

        <Card variant="accent" hover>
          <CardHeader>
            <CardTitle className="text-white/90 flex items-center gap-2">
              <span className="text-2xl">📖</span>
              QT 제출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">12</p>
            <p className="text-sm text-white/70 mt-1">회</p>
          </CardContent>
        </Card>
      </div>

      {/* 레벨 프로그레스 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            나의 성장
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-2xl font-bold text-primary">Lv.3</span>
            <span className="text-gray-500">믿음의 씨앗</span>
          </div>
          <div className="w-full bg-background-alt rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-light to-primary h-full rounded-full transition-all duration-500"
              style={{ width: '65%' }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">다음 레벨까지 35 달란트 더 필요해요!</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            최근 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-center justify-between p-3 bg-background-alt rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center">
                  <span className="text-success font-bold">+10</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">출석 달란트</span>
                  <p className="text-sm text-gray-400">주일예배 출석</p>
                </div>
              </div>
              <span className="text-sm text-gray-400 bg-white px-3 py-1 rounded-full">오늘</span>
            </li>
            <li className="flex items-center justify-between p-3 bg-background-alt rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center">
                  <span className="text-success font-bold">+20</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">QT 승인</span>
                  <p className="text-sm text-gray-400">창세기 1장 묵상</p>
                </div>
              </div>
              <span className="text-sm text-gray-400 bg-white px-3 py-1 rounded-full">어제</span>
            </li>
            <li className="flex items-center justify-between p-3 bg-background-alt rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                  <span className="text-accent font-bold">+5</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">퀴즈 정답</span>
                  <p className="text-sm text-gray-400">성경 퀴즈 맞추기</p>
                </div>
              </div>
              <span className="text-sm text-gray-400 bg-white px-3 py-1 rounded-full">2일 전</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
