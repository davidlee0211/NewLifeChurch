"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/student/dashboard", label: "홈", icon: "🏠" },
  { href: "/student/qt-upload", label: "QT 인증", icon: "📷" },
  { href: "/student/my-team", label: "내 팀", icon: "👥" },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const studentName = user?.name || "학생";
  const talent = (user as { talent?: number })?.talent || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 상단 헤더 */}
      <header className="bg-google-green border-b-4 border-green-700 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* 플랫폼 이름 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-roblox">
              <span className="text-lg">✨</span>
            </div>
            <h1 className="text-lg font-black text-white">
              모두의 주일학교
            </h1>
          </div>

          {/* 학생 이름 + 로그아웃 */}
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">{studentName}</span>
            <button
              onClick={signOut}
              className="bg-white/20 px-2 py-1 rounded-lg text-white text-xs font-bold hover:bg-white/30 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 달란트 표시 */}
        <div className="px-4 pb-3">
          <div className="bg-google-yellow px-4 py-2 rounded-lg border-b-2 border-yellow-600 inline-flex items-center gap-2">
            <span className="text-lg">🪙</span>
            <span className="font-black text-gray-800">{talent} 달란트</span>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="p-4">
        {children}
      </main>

      {/* 하단 네비게이션 바 (모바일 친화적) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 z-30">
        <ul className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center py-3 px-1 transition-all ${
                    isActive
                      ? "text-google-green"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <span className={`text-2xl ${isActive ? "scale-110" : ""} transition-transform`}>
                    {item.icon}
                  </span>
                  <span className={`text-xs mt-1 font-bold ${isActive ? "text-google-green" : ""}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="w-1 h-1 rounded-full bg-google-green mt-1" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
