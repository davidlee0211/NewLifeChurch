"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const games = [
  {
    title: "팀 뽑기",
    description: "랜덤으로 팀을 구성하거나 학생을 선발합니다.",
    href: "/admin/games/team-picker",
    icon: "🎲",
    variant: "red" as const,
  },
  {
    title: "퀴즈 보드",
    description: "실시간 퀴즈 게임을 진행합니다.",
    href: "/admin/games/quiz-board",
    icon: "❓",
    variant: "blue" as const,
  },
];

export default function GamesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <span>🎮</span> 게임
        </h2>
        <p className="text-gray-500 mt-1 font-semibold">재미있는 게임으로 아이들의 참여를 이끌어보세요!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game) => (
          <Link key={game.href} href={game.href}>
            <Card
              variant={game.variant}
              hover
              className="cursor-pointer h-full"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/30 rounded-lg flex items-center justify-center">
                    <span className="text-4xl">{game.icon}</span>
                  </div>
                  <CardTitle className="text-white text-2xl">{game.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 text-lg font-semibold">{game.description}</p>
                <div className="mt-4 flex items-center gap-2 text-white/60 font-bold">
                  <span>클릭하여 시작하기</span>
                  <span>→</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
