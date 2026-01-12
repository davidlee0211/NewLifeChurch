"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const teamMembers = [
  { id: 1, name: "김민준", talent: 180, rank: 1 },
  { id: 2, name: "이서연", talent: 150, rank: 2 },
  { id: 3, name: "박지훈", talent: 120, rank: 3 },
  { id: 4, name: "최수아", talent: 100, rank: 4 },
];

export default function MyTeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>👥</span> 내 팀
        </h2>
        <p className="text-gray-500 mt-1">팀원들과 함께 달란트를 모아요!</p>
      </div>

      <Card variant="gold" hover>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-2xl">⭐</span> 믿음팀
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">팀 총 달란트</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl">🪙</span>
                <p className="text-4xl font-bold">550</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/70">팀 순위</p>
              <div className="flex items-center gap-2 mt-1 justify-end">
                <span className="text-3xl">🏆</span>
                <p className="text-4xl font-bold">2위</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>👨‍👩‍👧‍👦</span> 팀원 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {teamMembers.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between p-4 bg-background-alt rounded-2xl"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-lg ${
                      member.rank === 1
                        ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900"
                        : member.rank === 2
                        ? "bg-gradient-to-br from-gray-200 to-gray-400 text-gray-700"
                        : member.rank === 3
                        ? "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {member.rank === 1 ? "🥇" : member.rank === 2 ? "🥈" : member.rank === 3 ? "🥉" : member.rank}
                  </span>
                  <span className="font-semibold text-gray-800">{member.name}</span>
                </div>
                <span className="font-bold text-primary-dark bg-primary/10 px-4 py-2 rounded-full">
                  {member.talent} 🪙
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🏅</span> 전체 팀 순위
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🥇</span>
                <div>
                  <span className="font-bold text-gray-800">사랑팀</span>
                  <p className="text-sm text-gray-500">1등 달성!</p>
                </div>
              </div>
              <span className="font-bold text-primary-dark bg-primary/10 px-4 py-2 rounded-full">620 🪙</span>
            </li>
            <li className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/30 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🥈</span>
                <div>
                  <span className="font-bold text-gray-800">믿음팀</span>
                  <span className="ml-2 text-xs bg-accent text-white px-2 py-0.5 rounded-full">내 팀</span>
                </div>
              </div>
              <span className="font-bold text-primary-dark bg-primary/10 px-4 py-2 rounded-full">550 🪙</span>
            </li>
            <li className="flex items-center justify-between p-4 bg-background-alt rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🥉</span>
                <span className="font-bold text-gray-800">소망팀</span>
              </div>
              <span className="font-bold text-primary-dark bg-primary/10 px-4 py-2 rounded-full">480 🪙</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
