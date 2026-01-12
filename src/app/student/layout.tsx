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
    <div className="min-h-screen bg-white">
      {/* 헤더 - 로블록스 스타일 */}
      <header className="bg-google-green border-b-4 border-green-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-roblox">
              <span className="text-xl">✨</span>
            </div>
            <h1 className="text-xl font-black text-white">
              모두의 주일학교
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-google-yellow px-4 py-2 rounded-lg border-b-2 border-yellow-600">
            <span className="text-xl">🪙</span>
            <span className="font-bold text-gray-800">150 달란트</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 사이드바 - 로블록스 스타일 */}
        <nav className="w-64 min-h-[calc(100vh-73px)] bg-gray-50 border-r-2 border-gray-200 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-100 font-bold ${
                    pathname === item.href
                      ? "bg-google-green text-white border-b-4 border-green-700 shadow-roblox"
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
