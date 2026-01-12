"use client";

import { useState, useEffect } from "react";
import type { User } from "@/types/database";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Supabase Auth 상태 확인 및 구독
    setLoading(false);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const signIn = async (name: string, password: string) => {
    // TODO: 로그인 로직 구현
    console.log("Sign in:", name);
  };

  const signOut = async () => {
    // TODO: 로그아웃 로직 구현
    setUser(null);
  };

  return {
    user,
    loading,
    signIn,
    signOut,
  };
}
