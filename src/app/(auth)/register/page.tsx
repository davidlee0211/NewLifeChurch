"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [churchName, setChurchName] = useState("");
  const [churchCode, setChurchCode] = useState("");
  const [adminId, setAdminId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 교회코드 유효성 검사 (영문+숫자, 3~20자)
      const codeRegex = /^[a-zA-Z0-9]{3,20}$/;
      if (!codeRegex.test(churchCode)) {
        setError("교회 코드는 영문과 숫자로 3~20자여야 합니다.");
        setIsLoading(false);
        return;
      }

      // 관리자 아이디 유효성 검사 (영문+숫자, 3~20자, 숫자로만 구성되면 안됨)
      const adminIdRegex = /^[a-zA-Z][a-zA-Z0-9]{2,19}$/;
      if (!adminIdRegex.test(adminId)) {
        setError("교사 아이디는 영문으로 시작하고 3~20자여야 합니다.");
        setIsLoading(false);
        return;
      }

      // 1. 교회 코드 중복 확인
      const { data: existingChurch } = await supabase
        .from("churches")
        .select("id")
        .eq("code", churchCode.toLowerCase())
        .single();

      if (existingChurch) {
        setError("이미 사용 중인 교회 코드입니다.");
        setIsLoading(false);
        return;
      }

      // 2. 교회 생성
      const { data: newChurch, error: churchError } = await supabase
        .from("churches")
        .insert([{
          name: churchName,
          code: churchCode.toLowerCase(),
          primary_color: "#4285F4",
        }] as never)
        .select()
        .single();

      if (churchError || !newChurch) {
        setError("교회 등록 중 오류가 발생했습니다.");
        setIsLoading(false);
        return;
      }

      const churchId = (newChurch as { id: string }).id;

      // 3. 관리자 생성
      const { error: adminError } = await supabase
        .from("admins")
        .insert([{
          church_id: churchId,
          name: "관리자",
          login_id: adminId.toLowerCase(),
          is_super: true,
        }] as never);

      if (adminError) {
        // 롤백: 교회 삭제
        await supabase.from("churches").delete().eq("id", churchId);
        setError("교사 등록 중 오류가 발생했습니다.");
        setIsLoading(false);
        return;
      }

      // 4. 기본 달란트 설정 생성
      await supabase.from("talent_settings").insert([
        { church_id: churchId, quest_type: "attendance", amount: 10 },
        { church_id: churchId, quest_type: "recitation", amount: 20 },
        { church_id: churchId, quest_type: "qt", amount: 15 },
      ] as never);

      setSuccess(true);
    } catch {
      setError("등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
        {/* 구글 컬러 장식 블록들 */}
        <div className="absolute top-10 left-10 w-16 h-16 bg-google-red rounded-lg rotate-12 opacity-80" />
        <div className="absolute top-20 right-20 w-12 h-12 bg-google-yellow rounded-lg -rotate-12 opacity-80" />
        <div className="absolute bottom-20 left-20 w-14 h-14 bg-google-green rounded-lg rotate-6 opacity-80" />
        <div className="absolute bottom-10 right-10 w-10 h-10 bg-google-blue rounded-lg -rotate-6 opacity-80" />

        <div className="w-full max-w-md p-8 bg-white rounded-xl border-2 border-gray-200 shadow-block relative z-10 mx-4 text-center">
          <div className="w-16 h-16 bg-google-green rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">등록 완료!</h2>
          <p className="text-gray-600 mb-6">
            교회 등록이 완료되었습니다.<br />
            아래 정보로 로그인하세요.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-1">교회 코드</p>
            <p className="font-bold text-lg text-google-blue">{churchCode.toLowerCase()}</p>
            <p className="text-sm text-gray-500 mb-1 mt-3">교사 아이디</p>
            <p className="font-bold text-lg text-google-blue">{adminId.toLowerCase()}</p>
          </div>

          <Button onClick={() => router.push("/login")} className="w-full" size="lg">
            로그인하기
          </Button>
        </div>
      </div>
    );
  }

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
            교회 등록
          </h1>

          {/* 구글 컬러 도트 */}
          <div className="flex justify-center gap-2 mt-3">
            <span className="w-3 h-3 rounded-full bg-google-red" />
            <span className="w-3 h-3 rounded-full bg-google-yellow" />
            <span className="w-3 h-3 rounded-full bg-google-green" />
            <span className="w-3 h-3 rounded-full bg-google-blue" />
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label htmlFor="churchName" className="block text-sm font-bold text-gray-700 mb-2">
              교회 이름
            </label>
            <Input
              id="churchName"
              type="text"
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
              placeholder="예: 새생명교회"
              required
            />
          </div>

          <div>
            <label htmlFor="churchCode" className="block text-sm font-bold text-gray-700 mb-2">
              교회 코드
            </label>
            <Input
              id="churchCode"
              type="text"
              value={churchCode}
              onChange={(e) => setChurchCode(e.target.value)}
              placeholder="예: newlife (영문+숫자, 3~20자)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">로그인할 때 사용할 코드입니다.</p>
          </div>

          <div>
            <label htmlFor="adminId" className="block text-sm font-bold text-gray-700 mb-2">
              교사 아이디
            </label>
            <Input
              id="adminId"
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="예: teacher (영문으로 시작, 3~20자)"
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
                <span className="animate-spin">⚙️</span>
                등록 중...
              </span>
            ) : (
              "교회 등록하기"
            )}
          </Button>

          <div className="text-center">
            <Link href="/login" className="text-sm text-google-blue hover:underline">
              이미 등록된 교회가 있나요? 로그인
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
