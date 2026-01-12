"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  children?: { href: string; label: string; icon: string }[];
}

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "대시보드", icon: "📊" },
  { href: "/admin/students", label: "학생 관리", icon: "👥" },
  { href: "/admin/attendance", label: "출석/암송 체크", icon: "✅" },
  { href: "/admin/weekly-verse", label: "암송 말씀 등록", icon: "✝️" },
  { href: "/admin/qt-topics", label: "QT 주제 등록", icon: "📖" },
  { href: "/admin/qt-approval", label: "QT 승인", icon: "📷" },
  { href: "/admin/talent", label: "달란트 관리", icon: "💰" },
  {
    href: "/admin/games",
    label: "게임",
    icon: "🎮",
    children: [
      { href: "/admin/games/team-picker", label: "팀 뽑기", icon: "🎲" },
      { href: "/admin/games/quiz-board", label: "퀴즈 보드게임", icon: "🎯" },
    ],
  },
  { href: "/admin/quizzes", label: "퀴즈 관리", icon: "❓" },
  { href: "/admin/settings", label: "설정", icon: "⚙️" },
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
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(
    pathname.startsWith("/admin/games") ? "/admin/games" : null
  );

  const adminName = user?.name || "선생님";
  const pageTitle = getPageTitle(pathname);

  const toggleSubmenu = (href: string) => {
    setExpandedMenu(expandedMenu === href ? null : href);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 모바일 오버레이 */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r-2 border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b-2 border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-google-blue rounded-xl flex items-center justify-center border-b-4 border-blue-700">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-800">모두의 주일학교</h1>
              <p className="text-xs text-gray-500 font-bold">교사용 관리 시스템</p>
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="p-3 overflow-y-auto h-[calc(100%-160px)]">
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
                          <span className="text-xl">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        <span
                          className={`transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          ▼
                        </span>
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
                                  <span>{child.icon}</span>
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
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 사이드바 푸터 */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t-2 border-gray-200 bg-white">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-10 h-10 bg-google-green rounded-xl flex items-center justify-center border-b-4 border-green-700">
              <span className="text-lg">👤</span>
            </div>
            <div>
              <p className="font-black text-gray-800 text-sm">{adminName}</p>
              <p className="text-xs text-gray-500">교사</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all font-bold text-sm"
          >
            <span>👋</span>
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 메인 영역 */}
      <div className="lg:ml-64">
        {/* 상단 헤더 */}
        <header className="sticky top-0 z-30 bg-white border-b-2 border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {/* 햄버거 메뉴 버튼 (모바일) */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="text-xl">☰</span>
              </button>

              {/* 페이지 제목 */}
              <h2 className="text-xl font-black text-gray-800">{pageTitle}</h2>
            </div>

            {/* 데스크톱: 교사 정보 + 로그아웃 */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl">
                <span className="text-lg">👤</span>
                <span className="font-bold text-gray-700">{adminName}</span>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all font-bold text-sm"
              >
                로그아웃
              </button>
            </div>

            {/* 모바일: 교사 아이콘만 */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-10 h-10 bg-google-green rounded-xl flex items-center justify-center border-b-4 border-green-700">
                <span className="text-lg">👤</span>
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
