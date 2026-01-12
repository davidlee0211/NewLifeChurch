"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Supabase 인증 로직 구현
    // 임시로 역할에 따라 라우팅
    setTimeout(() => {
      if (name.includes("교사") || name.includes("admin")) {
        router.push("/admin/dashboard");
      } else {
        router.push("/student/dashboard");
      }
      setIsLoading(false);
    }, 1000);
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
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              이름
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              비밀번호
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

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
