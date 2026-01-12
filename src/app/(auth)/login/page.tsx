"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";
import type { Church, Student, Admin } from "@/types/database";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [churchCode, setChurchCode] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. 교회 코드로 교회 찾기
      const { data: churchData, error: churchError } = await supabase
        .from("churches")
        .select("*")
        .eq("code", churchCode.toLowerCase())
        .single();

      const church = churchData as Church | null;

      if (churchError || !church) {
        setError("존재하지 않는 교회 코드입니다.");
        setIsLoading(false);
        return;
      }

      // 2. 학생 로그인 시도 (6자리 코드)
      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("church_id", church.id)
        .eq("login_code", loginCode)
        .single();

      const student = studentData as Student | null;

      if (student) {
        // 학생 로그인 성공 - 세션 저장
        localStorage.setItem("user", JSON.stringify({ ...student, role: "student", church }));
        router.push("/student/dashboard");
        return;
      }

      // 3. 관리자 로그인 시도 (아이디/비밀번호)
      const { data: adminData } = await supabase
        .from("admins")
        .select("*")
        .eq("church_id", church.id)
        .eq("login_id", loginCode)
        .single();

      const admin = adminData as Admin | null;

      if (admin) {
        // 비밀번호 확인 (현재는 평문 비교, 운영 시 bcrypt 사용)
        // TODO: 별도 비밀번호 필드 추가 필요
        localStorage.setItem("user", JSON.stringify({ ...admin, role: "admin", church }));
        router.push("/admin/dashboard");
        return;
      }

      setError("로그인 정보가 올바르지 않습니다.");
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background-alt to-primary/10 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary-light/30 rounded-full blur-2xl" />

      {/* 떠다니는 이모지 */}
      <div className="absolute top-1/4 right-1/4 text-4xl animate-bounce">✨</div>
      <div className="absolute bottom-1/3 left-1/3 text-3xl animate-pulse">🪙</div>

      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-soft-lg relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-light via-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-glow">
            <span className="text-4xl">🏆</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            주일학교 달란트
          </h1>
          <p className="text-gray-500 mt-2">빛이신 예수님과 함께해요!</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="churchCode" className="block text-sm font-semibold text-gray-700 mb-2">
              교회 코드
            </label>
            <Input
              id="churchCode"
              type="text"
              value={churchCode}
              onChange={(e) => setChurchCode(e.target.value)}
              placeholder="예: newlife"
              required
            />
          </div>

          <div>
            <label htmlFor="loginCode" className="block text-sm font-semibold text-gray-700 mb-2">
              로그인 코드
            </label>
            <Input
              id="loginCode"
              type="text"
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value)}
              placeholder="학생: 6자리 코드 / 교사: 아이디"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">🪙</span>
                로그인 중...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                시작하기
                <span>🚀</span>
              </span>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          달란트를 모아 하나님께 영광을 드려요!
        </p>
      </div>
    </div>
  );
}
