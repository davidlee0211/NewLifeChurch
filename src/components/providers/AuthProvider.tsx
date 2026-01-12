"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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

// Context 타입
interface AuthContextType {
  user: AuthUser;
  loading: boolean;
  isAuthenticated: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  churchId: string | undefined;
  church: Church | undefined;
  setAuthUser: (user: AuthUser) => void;
  signOut: () => void;
}

const AUTH_STORAGE_KEY = "user";

// Context 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider 컴포넌트
export function AuthProvider({ children }: { children: ReactNode }) {
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

  // 사용자 설정
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
    window.location.href = "/login";
  }, []);

  const value: AuthContextType = {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook으로 사용
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
