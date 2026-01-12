"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  // 숫자만 있으면 학생, 문자가 포함되면 관리자
  const isStudentCode = (code: string) => /^\d+$/.test(code);

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

      if (isStudentCode(loginCode)) {
        // 2. 학생 로그인 시도 (숫자 코드: 001~999)
        const { data: studentData } = await supabase
          .from("students")
          .select("*")
          .eq("church_id", church.id)
          .eq("login_code", loginCode)
          .single();

        const student = studentData as Student | null;

        if (student) {
          localStorage.setItem("user", JSON.stringify({ ...student, role: "student", church }));
          router.push("/student/dashboard");
          return;
        }

        setError("존재하지 않는 학생 코드입니다.");
      } else {
        // 3. 관리자 로그인 시도 (문자 아이디)
        const { data: adminData } = await supabase
          .from("admins")
          .select("*")
          .eq("church_id", church.id)
          .eq("login_id", loginCode.toLowerCase())
          .single();

        const admin = adminData as Admin | null;

        if (admin) {
          localStorage.setItem("user", JSON.stringify({ ...admin, role: "admin", church }));
          router.push("/admin/dashboard");
          return;
        }

        setError("존재하지 않는 교사 아이디입니다.");
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* 구글 컬러 장식 블록들 */}
      <div className="absolute top-10 left-10 w-16 h-16 bg-google-red rounded-lg rotate-12 opacity-80" />
      <div className="absolute top-20 right-20 w-12 h-12 bg-google-yellow rounded-lg -rotate-12 opacity-80" />
      <div className="absolute bottom-20 left-20 w-14 h-14 bg-google-green rounded-lg rotate-6 opacity-80" />
      <div className="absolute bottom-10 right-10 w-10 h-10 bg-google-blue rounded-lg -rotate-6 opacity-80" />

      {/* 추가 작은 블록들 */}
      <div className="absolute top-1/3 left-10 w-8 h-8 bg-google-blue rounded opacity-60" />
      <div className="absolute top-1/4 right-1/4 w-6 h-6 bg-google-green rounded opacity-60" />
      <div className="absolute bottom-1/3 right-16 w-8 h-8 bg-google-red rounded opacity-60" />
      <div className="absolute bottom-1/4 left-1/4 w-6 h-6 bg-google-yellow rounded opacity-60" />

      <div className="w-full max-w-md p-8 bg-white rounded-xl border-2 border-gray-200 shadow-block relative z-10 mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-800">
            모두의 주일학교
          </h1>

          {/* 구글 컬러 도트 */}
          <div className="flex justify-center gap-2 mt-3">
            <span className="w-3 h-3 rounded-full bg-google-red" />
            <span className="w-3 h-3 rounded-full bg-google-yellow" />
            <span className="w-3 h-3 rounded-full bg-google-green" />
            <span className="w-3 h-3 rounded-full bg-google-blue" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="churchCode" className="block text-sm font-bold text-gray-700 mb-2">
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
            <label htmlFor="loginCode" className="block text-sm font-bold text-gray-700 mb-2">
              로그인 코드
            </label>
            <Input
              id="loginCode"
              type="text"
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value)}
              placeholder="학생: 3자리 코드 / 교사: 아이디"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-2 border-google-red rounded-lg text-google-red text-sm text-center font-bold">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">🎮</span>
                로그인 중...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                시작하기!
              </span>
            )}
          </Button>

          <div className="text-center">
            <Link href="/register" className="text-sm text-google-blue hover:underline">
              교회 등록이 필요하신가요?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
