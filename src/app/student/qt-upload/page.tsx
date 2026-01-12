"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function QTUploadPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Supabase에 QT 제출 로직 구현
    setTimeout(() => {
      alert("QT가 제출되었습니다!");
      setTitle("");
      setContent("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>📖</span> QT 업로드
        </h2>
        <p className="text-gray-500 mt-1">오늘 말씀을 통해 느낀 점을 나눠주세요!</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>✏️</span> 새 QT 작성
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                제목
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 창세기 1장 묵상"
                required
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
                내용
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="오늘 QT를 통해 느낀 점을 작성해주세요 ✨"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 min-h-[200px] hover:border-primary/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이미지 첨부 (선택)
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <span className="text-4xl block mb-2">📷</span>
                  <p className="text-gray-500">클릭하여 이미지 업로드</p>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">🪙</span>
                  제출 중...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  QT 제출하기
                  <span>🚀</span>
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📚</span> 내 QT 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="p-4 bg-background-alt rounded-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center text-xl">
                    ✅
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">창세기 1장 묵상</h4>
                    <p className="text-sm text-gray-500 mt-1">2024년 1월 7일</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-semibold bg-success/20 text-success rounded-full">
                  승인됨 +20🪙
                </span>
              </div>
            </li>
            <li className="p-4 bg-background-alt rounded-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-xl">
                    ⏳
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">시편 23편 묵상</h4>
                    <p className="text-sm text-gray-500 mt-1">2024년 1월 6일</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-semibold bg-primary/20 text-primary-dark rounded-full">
                  대기 중
                </span>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
