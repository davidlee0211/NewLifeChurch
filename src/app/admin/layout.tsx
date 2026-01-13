"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  BookOpen,
  FileText,
  Camera,
  Coins,
  Gamepad2,
  Dices,
  Target,
  HelpCircle,
  Settings,
  User,
  LogOut,
  Sparkles,
  Menu,
  ChevronDown
} from "lucide-react";
// Note: User, LogOut are used in the header
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: { href: string; label: string; icon: LucideIcon }[];
}

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/students", label: "학생 관리", icon: Users },
  { href: "/admin/attendance", label: "출석/암송 체크", icon: CheckCircle },
  { href: "/admin/weekly-verse", label: "암송 말씀 등록", icon: BookOpen },
  { href: "/admin/qt-topics", label: "QT 주제 등록", icon: FileText },
  { href: "/admin/qt-approval", label: "QT 승인", icon: Camera },
  { href: "/admin/talent", label: "달란트 관리", icon: Coins },
  {
    href: "/admin/games",
    label: "게임",
    icon: Gamepad2,
    children: [
      { href: "/admin/games/team-picker", label: "팀 뽑기", icon: Dices },
      { href: "/admin/games/quiz-board", label: "퀴즈 보드게임", icon: Target },
    ],
  },
  { href: "/admin/quizzes", label: "퀴즈 관리", icon: HelpCircle },
  { href: "/admin/settings", label: "설정", icon: Settings },
];

// 현재 경로에 해당하는 페이지 제목 가져오기
const getPageTitle = (pathname: string): string => {
  for (const item of navItems) {
    if (item.children) {
      for (const child of item.children) {
        if (pathname === child.href) return child.label;
      }
    }
    if (pathname === item.href) return item.label;
  }
  return "관리자";
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAdmin, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(
    pathname.startsWith("/admin/games") ? "/admin/games" : null
  );

  // 권한 체크: 관리자가 아니면 리다이렉트
  useEffect(() => {
    if (!loading && !isAdmin) {
      if (user?.role === "student") {
        router.replace("/student/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [loading, isAdmin, user, router]);

  // 로딩 중이거나 권한이 없으면 빈 화면
  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-google-blue rounded-xl flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  }

  const adminName = user?.name || "선생님";
  const pageTitle = getPageTitle(pathname);

  const toggleSubmenu = (href: string) => {
    setExpandedMenu(expandedMenu === href ? null : href);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 모바일 오버레이 */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 사이드바 헤더 */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-google-blue rounded-xl flex items-center justify-center border-b-4 border-blue-700">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-800">모두의 주일학교</h1>
              <p className="text-xs text-gray-500 font-bold">교사용 관리 시스템</p>
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="p-3 overflow-y-auto h-[calc(100%-80px)]">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenu === item.href;

              return (
                <li key={item.href}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleSubmenu(item.href)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold ${
                          isActive
                            ? "bg-google-blue text-white border-b-4 border-blue-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isExpanded && (
                        <ul className="mt-1 ml-4 space-y-1">
                          {item.children!.map((child) => {
                            const isChildActive = pathname === child.href;
                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  onClick={closeSidebar}
                                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all font-bold text-sm ${
                                    isChildActive
                                      ? "bg-blue-100 text-google-blue"
                                      : "text-gray-500 hover:bg-gray-100"
                                  }`}
                                >
                                  <child.icon className="w-4 h-4" />
                                  <span>{child.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={closeSidebar}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${
                        isActive
                          ? "bg-google-blue text-white border-b-4 border-blue-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* 메인 영역 */}
      <div className="lg:ml-64">
        {/* 상단 헤더 */}
        <header className="sticky top-0 z-30 bg-white">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {/* 햄버거 메뉴 버튼 (모바일) */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>

              {/* 페이지 제목 */}
              <h2 className="text-xl font-black text-gray-800">{pageTitle}</h2>
            </div>

            {/* 데스크톱: 교사 정보 + 로그아웃 */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl">
                <User className="w-5 h-5 text-gray-600" />
                <span className="font-bold text-gray-700">{adminName}</span>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all font-bold text-sm flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>

            {/* 모바일: 교사 아이콘만 */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-10 h-10 bg-google-green rounded-xl flex items-center justify-center border-b-4 border-green-700">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
