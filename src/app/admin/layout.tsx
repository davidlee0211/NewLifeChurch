"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/dashboard", label: "대시보드", icon: "🏠" },
  { href: "/admin/students", label: "학생 관리", icon: "👨‍🎓" },
  { href: "/admin/attendance", label: "출석 체크", icon: "✅" },
  { href: "/admin/qt-approval", label: "QT 승인", icon: "📖" },
  { href: "/admin/talent", label: "달란트 관리", icon: "🪙" },
  { href: "/admin/games", label: "게임", icon: "🎮" },
  { href: "/admin/quizzes", label: "퀴즈 관리", icon: "❓" },
  { href: "/admin/settings", label: "설정", icon: "⚙️" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-accent to-accent-light shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">👑</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">주일학교 달란트</h1>
              <p className="text-white/70 text-sm">관리자 모드</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full">
              <span className="text-white font-medium">김교사 선생님</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className="w-64 min-h-[calc(100vh-81px)] bg-white shadow-soft m-4 rounded-3xl p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                    pathname.startsWith(item.href)
                      ? "bg-gradient-to-r from-accent to-accent-light text-white shadow-md font-semibold"
                      : "text-gray-600 hover:bg-background-alt"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <Link
              href="/login"
              className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-background-alt rounded-2xl transition-all duration-200"
            >
              <span className="text-xl">👋</span>
              <span>로그아웃</span>
            </Link>
          </div>
        </nav>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
