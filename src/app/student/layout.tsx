"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/student/dashboard", label: "대시보드", icon: "🏠" },
  { href: "/student/qt-upload", label: "QT 업로드", icon: "📖" },
  { href: "/student/my-team", label: "내 팀", icon: "👥" },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-soft">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-primary rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">✨</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              주일학교 달란트
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <span className="text-2xl">🪙</span>
            <span className="font-bold text-primary-dark">150 달란트</span>
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className="w-64 min-h-[calc(100vh-73px)] bg-white shadow-soft m-4 rounded-3xl p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                    pathname === item.href
                      ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-soft font-semibold"
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
