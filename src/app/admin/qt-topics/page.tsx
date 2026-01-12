"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface QTTopic {
  id: string;
  date: string;
  title: string;
  content: string;
  image_url: string | null;
}

export default function QTTopicsPage() {
  const { churchId } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [topic, setTopic] = useState<QTTopic | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recentTopics, setRecentTopics] = useState<QTTopic[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 선택한 날짜의 QT 주제 로드
  useEffect(() => {
    const fetchTopic = async () => {
      if (!churchId) return;

      setIsLoading(true);

      const { data } = await supabase
        .from("qt_topics")
        .select("*")
        .eq("church_id", churchId)
        .eq("date", selectedDate)
        .single();

      if (data) {
        const topicData = data as QTTopic;
        setTopic(topicData);
        setTitle(topicData.title);
        setContent(topicData.content);
        setPreviewUrl(topicData.image_url);
      } else {
        setTopic(null);
        setTitle("");
        setContent("");
        setPreviewUrl(null);
      }

      setSelectedImage(null);
      setIsLoading(false);
    };

    fetchTopic();
  }, [churchId, selectedDate]);

  // 최근 QT 주제 목록 로드
  useEffect(() => {
    const fetchRecentTopics = async () => {
      if (!churchId) return;

      const { data } = await supabase
        .from("qt_topics")
        .select("*")
        .eq("church_id", churchId)
        .order("date", { ascending: false })
        .limit(7);

      if (data) {
        setRecentTopics(data as QTTopic[]);
      }
    };

    fetchRecentTopics();
  }, [churchId, topic]);

  // 이미지 선택
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 이미지 제거
  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 저장
  const handleSave = async () => {
    if (!churchId || !title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      let imageUrl = topic?.image_url || null;

      // 새 이미지가 선택된 경우 업로드
      if (selectedImage) {
        const timestamp = Date.now();
        const fileExt = selectedImage.name.split(".").pop() || "jpg";
        const filePath = `qt-topics/${churchId}/${selectedDate}_${timestamp}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("qt-photos")
          .upload(filePath, selectedImage);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          alert("이미지 업로드 중 오류가 발생했습니다.");
          setIsSaving(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("qt-photos")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      if (topic) {
        // 기존 주제 업데이트
        const { error } = await supabase
          .from("qt_topics")
          .update({
            title: title.trim(),
            content: content.trim(),
            image_url: imageUrl,
          } as never)
          .eq("id", topic.id);

        if (error) {
          alert("저장 중 오류가 발생했습니다.");
          setIsSaving(false);
          return;
        }
      } else {
        // 새 주제 생성
        const { error } = await supabase
          .from("qt_topics")
          .insert([{
            church_id: churchId,
            date: selectedDate,
            title: title.trim(),
            content: content.trim(),
            image_url: imageUrl,
          }] as never);

        if (error) {
          alert("저장 중 오류가 발생했습니다.");
          setIsSaving(false);
          return;
        }
      }

      // 성공 - 데이터 다시 로드
      const { data: newData } = await supabase
        .from("qt_topics")
        .select("*")
        .eq("church_id", churchId)
        .eq("date", selectedDate)
        .single();

      if (newData) {
        setTopic(newData as QTTopic);
      }

      alert("저장되었습니다!");
    } catch (error) {
      console.error("Error:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!topic) return;

    if (!confirm("이 QT 주제를 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from("qt_topics")
      .delete()
      .eq("id", topic.id);

    if (error) {
      alert("삭제 중 오류가 발생했습니다.");
      return;
    }

    setTopic(null);
    setTitle("");
    setContent("");
    setPreviewUrl(null);
    setSelectedImage(null);
  };

  // 날짜 이동
  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  // 오늘인지 확인
  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  // 날짜 포맷
  const formatDateKorean = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayNames[date.getDay()]})`;
  };

  return (
    <div className="space-y-6">
      {/* 날짜 선택 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeDate(-1)}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 transition-colors"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-2xl font-black text-gray-800">
              {formatDateKorean(selectedDate)}
            </p>
            {isToday && (
              <span className="text-xs bg-google-blue text-white px-2 py-0.5 rounded font-bold">
                오늘
              </span>
            )}
          </div>
          <button
            onClick={() => changeDate(1)}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 transition-colors"
          >
            ›
          </button>
        </div>

        <Button
          variant="secondary"
          onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
        >
          오늘로 이동
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QT 주제 편집 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>📖</span>
                  {topic ? "QT 주제 수정" : "QT 주제 등록"}
                </span>
                {topic && (
                  <Button variant="ghost" size="sm" onClick={handleDelete}>
                    🗑️ 삭제
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <p className="text-gray-500 font-bold">로딩 중...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 제목 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      제목 *
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="예: 창세기 1장 - 천지창조"
                    />
                  </div>

                  {/* 내용 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      내용 (선택)
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="오늘 QT 주제에 대한 설명이나 묵상 포인트를 작성해주세요"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue transition-all min-h-[120px] resize-none"
                    />
                  </div>

                  {/* 이미지 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      이미지 (선택)
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    {previewUrl ? (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="미리보기"
                          className="w-full max-h-64 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          onClick={removeImage}
                          className="absolute top-2 right-2 w-8 h-8 bg-google-red text-white rounded-full flex items-center justify-center font-bold shadow-lg hover:scale-110 transition-transform"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-google-blue hover:bg-blue-50 transition-all"
                      >
                        <div className="text-center">
                          <span className="text-3xl">📷</span>
                          <p className="text-gray-500 font-bold mt-2">
                            클릭하여 이미지 추가
                          </p>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* 저장 버튼 */}
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !title.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        저장 중...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>💾</span>
                        {topic ? "수정하기" : "등록하기"}
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 최근 QT 주제 목록 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📅</span> 최근 QT 주제
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTopics.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  등록된 QT 주제가 없습니다.
                </p>
              ) : (
                <ul className="space-y-2">
                  {recentTopics.map((t) => {
                    const isSelected = t.date === selectedDate;
                    return (
                      <li key={t.id}>
                        <button
                          onClick={() => setSelectedDate(t.date)}
                          className={`w-full text-left p-3 rounded-xl transition-all ${
                            isSelected
                              ? "bg-google-blue text-white"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <p className={`text-xs font-bold ${isSelected ? "text-white/80" : "text-gray-500"}`}>
                            {formatDateKorean(t.date)}
                          </p>
                          <p className={`font-bold truncate ${isSelected ? "text-white" : "text-gray-800"}`}>
                            {t.title}
                          </p>
                          {t.image_url && (
                            <span className={`text-xs ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                              📷 이미지 포함
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
