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
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <span>👥</span> 내 팀
        </h2>
        <p className="text-gray-500 mt-1 font-semibold">팀원들과 함께 달란트를 모아요!</p>
      </div>

      <Card variant="blue" hover>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-2xl">⭐</span> 믿음팀
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70 font-semibold">팀 총 달란트</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl">🪙</span>
                <p className="text-4xl font-black text-white">550</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/70 font-semibold">팀 순위</p>
              <div className="flex items-center gap-2 mt-1 justify-end">
                <span className="text-3xl">🏆</span>
                <p className="text-4xl font-black text-white">2위</p>
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
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-black text-lg ${
                      member.rank === 1
                        ? "bg-google-yellow text-gray-800 border-b-2 border-yellow-600"
                        : member.rank === 2
                        ? "bg-gray-200 text-gray-700 border-b-2 border-gray-400"
                        : member.rank === 3
                        ? "bg-orange-200 text-orange-800 border-b-2 border-orange-400"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {member.rank === 1 ? "🥇" : member.rank === 2 ? "🥈" : member.rank === 3 ? "🥉" : member.rank}
                  </span>
                  <span className="font-bold text-gray-800">{member.name}</span>
                </div>
                <span className="font-bold text-gray-700 bg-google-yellow/30 px-4 py-2 rounded-lg">
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
            <li className="flex items-center justify-between p-4 bg-google-yellow/20 border-2 border-google-yellow rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🥇</span>
                <div>
                  <span className="font-bold text-gray-800">사랑팀</span>
                  <p className="text-sm text-gray-500 font-semibold">1등 달성!</p>
                </div>
              </div>
              <span className="font-bold text-gray-700 bg-google-yellow/50 px-4 py-2 rounded-lg">620 🪙</span>
            </li>
            <li className="flex items-center justify-between p-4 bg-google-blue/10 border-2 border-google-blue/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🥈</span>
                <div>
                  <span className="font-bold text-gray-800">믿음팀</span>
                  <span className="ml-2 text-xs bg-google-blue text-white px-2 py-0.5 rounded font-bold">내 팀</span>
                </div>
              </div>
              <span className="font-bold text-gray-700 bg-google-yellow/30 px-4 py-2 rounded-lg">550 🪙</span>
            </li>
            <li className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-100 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🥉</span>
                <span className="font-bold text-gray-800">소망팀</span>
              </div>
              <span className="font-bold text-gray-700 bg-google-yellow/30 px-4 py-2 rounded-lg">480 🪙</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
