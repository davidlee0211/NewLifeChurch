"use client";

import { useState, useEffect } from "react";
import type { Student, Admin, Church } from "@/types/database";

type AuthUser =
  | (Student & { role: 'student'; church: Church })
  | (Admin & { role: 'admin'; church: Church })
  | null;

export function useAuth() {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 로컬스토리지에서 세션 복원
    setLoading(false);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const signIn = async (churchCode: string, loginCode: string) => {
    // TODO: 로그인 로직 구현
    // 1. churchCode로 교회 찾기
    // 2. loginCode로 학생/관리자 찾기
    console.log("Sign in:", churchCode, loginCode);
  };

  const signOut = async () => {
    // TODO: 로그아웃 로직 구현
    setUser(null);
  };

  return {
    user,
    loading,
    isStudent: user?.role === 'student',
    isAdmin: user?.role === 'admin',
    churchId: user?.church_id,
    signIn,
    signOut,
  };
}
