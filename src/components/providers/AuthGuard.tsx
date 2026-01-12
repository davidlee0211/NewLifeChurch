"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "./AuthProvider";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, isStudent, isAdmin } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // 로그인 페이지나 홈은 통과
    if (pathname === "/" || pathname === "/login") {
      return;
    }

    // 미로그인 시 로그인 페이지로
    if (!user) {
      router.replace("/login");
      return;
    }

    // 학생 경로에 관리자가 접근하면 관리자 대시보드로
    if (pathname.startsWith("/student") && isAdmin) {
      router.replace("/admin/dashboard");
      return;
    }

    // 관리자 경로에 학생이 접근하면 학생 대시보드로
    if (pathname.startsWith("/admin") && isStudent) {
      router.replace("/student/dashboard");
      return;
    }
  }, [user, loading, pathname, router, isStudent, isAdmin]);

  // 로딩 중 표시 - 로블록스 스타일
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-google-blue rounded-xl flex items-center justify-center animate-bounce shadow-roblox-lg border-b-4 border-blue-700">
            <span className="text-3xl">🎮</span>
          </div>
          <p className="text-gray-500 font-bold">로딩 중...</p>
          {/* 구글 컬러 도트 */}
          <div className="flex justify-center gap-2 mt-3">
            <span className="w-2 h-2 rounded-full bg-google-red animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-google-yellow animate-pulse delay-75" />
            <span className="w-2 h-2 rounded-full bg-google-green animate-pulse delay-150" />
            <span className="w-2 h-2 rounded-full bg-google-blue animate-pulse delay-200" />
          </div>
        </div>
      </div>
    );
  }

  // 보호된 경로에서 미로그인 상태면 렌더링하지 않음
  if (!user && pathname !== "/" && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}
