"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Student, Admin, Church } from "@/types/database";

// 학생 사용자 타입
export interface StudentUser extends Student {
  role: "student";
  church: Church;
}

// 관리자 사용자 타입
export interface AdminUser extends Admin {
  role: "admin";
  church: Church;
}

// 통합 사용자 타입
export type AuthUser = StudentUser | AdminUser | null;

const AUTH_STORAGE_KEY = "user";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  // localStorage에서 세션 복원
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
      }
    } catch (error) {
      console.error("Failed to restore auth session:", error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // 로그인 (로그인 페이지에서 직접 처리하므로 여기서는 상태만 업데이트)
  const setAuthUser = useCallback((authUser: AuthUser) => {
    setUser(authUser);
    if (authUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  // 로그아웃
  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push("/login");
  }, [router]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isStudent: user?.role === "student",
    isAdmin: user?.role === "admin",
    churchId: user?.church_id,
    church: user?.church,
    setAuthUser,
    signOut,
  };
}
