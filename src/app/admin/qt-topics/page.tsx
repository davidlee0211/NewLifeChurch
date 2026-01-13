"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { BookOpen, ChevronLeft, ChevronRight, Loader2, Save, Pencil, Trash2, Camera, Plus, X } from "lucide-react";

interface QTTopic {
  id: string;
  date: string;
  title: string;
  content: string;
  image_urls: string[];
}

export default function QTTopicsPage() {
  const { churchId } = useAuth();
  // 로컬 시간 기준 날짜 (YYYY-MM-DD)
  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [topic, setTopic] = useState<QTTopic | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 선택한 날짜의 QT 주제 로드
  useEffect(() => {
    const fetchTopic = async () => {
      if (!churchId) return;

      setIsLoading(true);
      setIsEditMode(false);

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
        setExistingUrls(topicData.image_urls || []);
        setPreviewUrls([]);
      } else {
        setTopic(null);
        setTitle("");
        setContent("");
        setExistingUrls([]);
        setPreviewUrls([]);
        setIsEditMode(true); // 등록된 주제가 없으면 편집 모드
      }

      setSelectedImages([]);
      setIsLoading(false);
    };

    fetchTopic();
  }, [churchId, selectedDate]);

  // 이미지 선택 (다중)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 최대 10개까지 허용
    const totalCount = existingUrls.length + selectedImages.length + files.length;
    if (totalCount > 10) {
      alert("이미지는 최대 10개까지 업로드할 수 있습니다.");
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);

    // 미리보기 URL 생성
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  // 새로 선택한 이미지 제거
  const removeNewImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 기존 이미지 제거
  const removeExistingImage = (index: number) => {
    setExistingUrls(prev => prev.filter((_, i) => i !== index));
  };

  // 저장
  const handleSave = async () => {
    if (!churchId || !title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      // 새 이미지들 업로드
      const newImageUrls: string[] = [];

      for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i];
        const timestamp = Date.now();
        const fileExt = file.name.split(".").pop() || "jpg";
        const filePath = `qt-topics/${churchId}/${selectedDate}_${timestamp}_${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("qt-topics")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          alert("이미지 업로드 중 오류가 발생했습니다.");
          setIsSaving(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("qt-topics")
          .getPublicUrl(filePath);

        newImageUrls.push(urlData.publicUrl);
      }

      // 기존 이미지 + 새 이미지
      const allImageUrls = [...existingUrls, ...newImageUrls];

      if (topic) {
        // 기존 주제 업데이트
        const { error } = await supabase
          .from("qt_topics")
          .update({
            title: title.trim(),
            content: content.trim(),
            image_urls: allImageUrls,
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
            image_urls: allImageUrls,
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
        const topicData = newData as QTTopic;
        setTopic(topicData);
        setExistingUrls(topicData.image_urls || []);
        setPreviewUrls([]);
        setSelectedImages([]);
      }

      setIsEditMode(false); // 저장 후 미리보기 모드로
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
    setExistingUrls([]);
    setPreviewUrls([]);
    setSelectedImages([]);
    setIsEditMode(true);
  };

  // 날짜 이동
  const changeDate = (days: number) => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    setSelectedDate(getLocalDateString(date));
  };

  // 오늘인지 확인
  const isToday = selectedDate === getLocalDateString();

  // 날짜 포맷 (로컬 시간 기준)
  const formatDateKorean = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayNames[date.getDay()]})`;
  };

  // 총 이미지 개수
  const totalImageCount = existingUrls.length + selectedImages.length;
  const canAddMore = totalImageCount < 10;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-google-blue" />
          QT 주제 등록
        </h2>
      </div>

      {/* 날짜 선택 */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => changeDate(-1)}
          className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center min-w-[200px]">
          <p className="text-xl font-black text-gray-800">
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
          className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        {!isToday && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedDate(getLocalDateString())}
          >
            오늘로
          </Button>
        )}
      </div>

      {/* 메인 컨텐츠 */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-google-blue" />
              {!topic ? "QT 주제 등록" : isEditMode ? "QT 주제 수정" : "QT 주제"}
            </span>
            {topic && !isEditMode && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsEditMode(true)} className="flex items-center gap-1">
                  <Pencil className="w-4 h-4" />
                  수정
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDelete} className="flex items-center gap-1">
                  <Trash2 className="w-4 h-4" />
                  삭제
                </Button>
              </div>
            )}
            {topic && isEditMode && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditMode(false)}>
                취소
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
              <p className="text-gray-500 font-bold">로딩 중...</p>
            </div>
          ) : isEditMode ? (
            /* 편집 모드 */
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
                  이미지 (선택, 최대 10개) - {totalImageCount}/10
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* 이미지 그리드 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  {/* 기존 이미지들 */}
                  {existingUrls.map((url, index) => (
                    <div key={`existing-${index}`} className="relative aspect-square">
                      <img
                        src={url}
                        alt={`이미지 ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl border-2 border-gray-200"
                      />
                      <button
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-google-red text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* 새로 선택한 이미지들 */}
                  {previewUrls.map((url, index) => (
                    <div key={`new-${index}`} className="relative aspect-square">
                      <img
                        src={url}
                        alt={`새 이미지 ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl border-2 border-google-blue"
                      />
                      <div className="absolute top-1 left-1 px-2 py-0.5 bg-google-blue text-white text-xs rounded font-bold">
                        NEW
                      </div>
                      <button
                        onClick={() => removeNewImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-google-red text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* 추가 버튼 */}
                  {canAddMore && totalImageCount > 0 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-google-blue hover:bg-blue-50 transition-all flex flex-col items-center justify-center"
                    >
                      <Plus className="w-6 h-6 text-gray-400" />
                      <p className="text-gray-500 font-bold text-xs mt-1">
                        이미지 추가
                      </p>
                    </button>
                  )}
                </div>

                {/* 빈 상태 */}
                {totalImageCount === 0 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-google-blue hover:bg-blue-50 transition-all"
                  >
                    <div className="text-center">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-gray-500 font-bold mt-2">
                        클릭하여 이미지 추가 (최대 10개)
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
                    <Loader2 className="w-5 h-5 animate-spin" />
                    저장 중...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" />
                    {topic ? "수정하기" : "등록하기"}
                  </span>
                )}
              </Button>
            </div>
          ) : (
            /* 미리보기 모드 */
            <div className="space-y-4">
              {/* 제목 */}
              <div className="p-6 bg-google-blue/5 rounded-2xl shadow-sm">
                <p className="text-2xl font-black text-google-blue">{title}</p>
              </div>

              {/* 내용 */}
              {content && (
                <div className="p-6 bg-gray-50 rounded-2xl">
                  <p className="text-lg text-gray-700 whitespace-pre-wrap leading-relaxed">{content}</p>
                </div>
              )}

              {/* 이미지들 */}
              {existingUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {existingUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={url}
                        alt={`이미지 ${index + 1}`}
                        className="w-full h-full object-cover rounded-2xl shadow-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
