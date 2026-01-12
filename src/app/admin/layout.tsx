"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/dashboard", label: "대시보드", icon: "🏠", color: "blue" },
  { href: "/admin/students", label: "학생 관리", icon: "👨‍🎓", color: "green" },
  { href: "/admin/attendance", label: "출석 체크", icon: "✅", color: "yellow" },
  { href: "/admin/qt-approval", label: "QT 승인", icon: "📖", color: "red" },
  { href: "/admin/talent", label: "달란트 관리", icon: "🪙", color: "yellow" },
  { href: "/admin/games", label: "게임", icon: "🎮", color: "blue" },
  { href: "/admin/quizzes", label: "퀴즈 관리", icon: "❓", color: "green" },
  { href: "/admin/settings", label: "설정", icon: "⚙️", color: "red" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 - 로블록스 스타일 */}
      <header className="bg-google-blue border-b-4 border-blue-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-roblox">
              <span className="text-xl">👑</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-white">모두의 주일학교</h1>
              <p className="text-white/70 text-sm font-semibold">관리자 모드</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-lg border-b-2 border-gray-200">
              <span className="text-gray-700 font-bold">김교사 선생님</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 사이드바 - 로블록스 스타일 */}
        <nav className="w-64 min-h-[calc(100vh-81px)] bg-gray-50 border-r-2 border-gray-200 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-100 font-bold ${
                    pathname.startsWith(item.href)
                      ? "bg-google-blue text-white border-b-4 border-blue-700 shadow-roblox"
                      : "text-gray-600 hover:bg-gray-100 border-b-2 border-transparent"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 pt-8 border-t-2 border-gray-200">
            <Link
              href="/login"
              className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-lg transition-all duration-100 font-bold"
            >
              <span className="text-xl">👋</span>
              <span>로그아웃</span>
            </Link>
          </div>
        </nav>

        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
