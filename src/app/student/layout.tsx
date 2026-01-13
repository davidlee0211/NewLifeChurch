"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Home, Camera, Users, Trophy, Sparkles, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/student/dashboard", label: "홈", icon: Home },
  { href: "/student/qt-upload", label: "QT 인증", icon: Camera },
  { href: "/student/my-team", label: "내 팀", icon: Users },
  { href: "/student/leaderboard", label: "리더보드", icon: Trophy },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isStudent, signOut } = useAuth();

  const studentName = user?.name || "학생";

  // 권한 체크: 학생이 아니면 리다이렉트
  useEffect(() => {
    if (!loading && !isStudent) {
      if (user?.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [loading, isStudent, user, router]);

  // 로딩 중이거나 권한이 없으면 빈 화면
  if (loading || !isStudent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-google-green rounded-xl flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 상단 헤더 */}
      <header className="bg-google-green border-b-4 border-green-700 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* 플랫폼 이름 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-roblox">
              <Sparkles className="w-5 h-5 text-google-green" />
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
              className="bg-white/20 px-2 py-1 rounded-lg text-white text-xs font-bold hover:bg-white/30 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              로그아웃
            </button>
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
                  <item.icon className={`w-6 h-6 ${isActive ? "scale-110" : ""} transition-transform`} />
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
