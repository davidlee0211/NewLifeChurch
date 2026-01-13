"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { BookOpen, ChevronLeft, ChevronRight, Loader2, Save, Check, Pencil, Trash2 } from "lucide-react";

interface WeeklyVerse {
  id: string;
  week_start: string;
  reference_ko: string;
  reference_en: string | null;
  reference_fr: string | null;
  verse_ko: string;
  verse_en: string | null;
  verse_fr: string | null;
}

type Language = "ko" | "en" | "fr";

const languageLabels: Record<Language, { name: string; flag: string }> = {
  ko: { name: "한국어", flag: "🇰🇷" },
  en: { name: "English", flag: "🇺🇸" },
  fr: { name: "Français", flag: "🇫🇷" },
};

export default function WeeklyVersePage() {
  const { churchId } = useAuth();

  // 로컬 시간 기준 날짜 (YYYY-MM-DD)
  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 다음 일요일 (암송하는 날) 구하기 (로컬 시간 기준)
  function getNextSunday(): string {
    const today = new Date();
    const day = today.getDay();
    // 오늘이 일요일이면 오늘, 아니면 다음 일요일
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    return getLocalDateString(nextSunday);
  }

  // 암송 일요일 기준으로 등록 주(week_start) 계산 (1주 전)
  function getWeekStartFromRecitation(recitationDate: string): string {
    const [year, month, day] = recitationDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - 7); // 1주 전 일요일이 등록 주
    return getLocalDateString(date);
  }

  // 선택된 암송 일요일 (UI에 표시되는 날짜)
  const [selectedRecitationDate, setSelectedRecitationDate] = useState(getNextSunday());
  // 실제 DB에 저장되는 week_start (암송일 - 7일)
  const selectedWeek = getWeekStartFromRecitation(selectedRecitationDate);
  const [verse, setVerse] = useState<WeeklyVerse | null>(null);
  const [activeTab, setActiveTab] = useState<Language>("ko");
  const [isEditMode, setIsEditMode] = useState(false);

  // 다국어 상태
  const [referenceKo, setReferenceKo] = useState("");
  const [referenceEn, setReferenceEn] = useState("");
  const [referenceFr, setReferenceFr] = useState("");
  const [verseKo, setVerseKo] = useState("");
  const [verseEn, setVerseEn] = useState("");
  const [verseFr, setVerseFr] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 선택한 주의 암송 말씀 로드
  useEffect(() => {
    const fetchVerse = async () => {
      if (!churchId) return;

      setIsLoading(true);
      setIsEditMode(false);

      const { data } = await supabase
        .from("weekly_verses")
        .select("*")
        .eq("church_id", churchId)
        .eq("week_start", selectedWeek)
        .single();

      if (data) {
        const verseData = data as WeeklyVerse;
        setVerse(verseData);
        setReferenceKo(verseData.reference_ko || "");
        setReferenceEn(verseData.reference_en || "");
        setReferenceFr(verseData.reference_fr || "");
        setVerseKo(verseData.verse_ko || "");
        setVerseEn(verseData.verse_en || "");
        setVerseFr(verseData.verse_fr || "");
      } else {
        setVerse(null);
        setReferenceKo("");
        setReferenceEn("");
        setReferenceFr("");
        setVerseKo("");
        setVerseEn("");
        setVerseFr("");
        setIsEditMode(true); // 등록된 말씀이 없으면 편집 모드
      }

      setIsLoading(false);
    };

    fetchVerse();
  }, [churchId, selectedWeek]);

  // 저장
  const handleSave = async () => {
    if (!churchId || !referenceKo.trim() || !verseKo.trim()) {
      alert("한국어 성경 구절과 말씀 내용은 필수입니다.");
      return;
    }

    setIsSaving(true);

    try {
      const verseData = {
        reference_ko: referenceKo.trim(),
        reference_en: referenceEn.trim() || null,
        reference_fr: referenceFr.trim() || null,
        verse_ko: verseKo.trim(),
        verse_en: verseEn.trim() || null,
        verse_fr: verseFr.trim() || null,
      };

      if (verse) {
        // 기존 말씀 업데이트
        const { error } = await supabase
          .from("weekly_verses")
          .update(verseData as never)
          .eq("id", verse.id);

        if (error) {
          alert("저장 중 오류가 발생했습니다.");
          setIsSaving(false);
          return;
        }
      } else {
        // 새 말씀 생성
        const { error } = await supabase
          .from("weekly_verses")
          .insert([{
            church_id: churchId,
            week_start: selectedWeek,
            ...verseData,
          }] as never);

        if (error) {
          alert("저장 중 오류가 발생했습니다.");
          setIsSaving(false);
          return;
        }
      }

      // 성공 - 데이터 다시 로드
      const { data: newData } = await supabase
        .from("weekly_verses")
        .select("*")
        .eq("church_id", churchId)
        .eq("week_start", selectedWeek)
        .single();

      if (newData) {
        setVerse(newData as WeeklyVerse);
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
    if (!verse) return;

    if (!confirm("이 암송 말씀을 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from("weekly_verses")
      .delete()
      .eq("id", verse.id);

    if (error) {
      alert("삭제 중 오류가 발생했습니다.");
      return;
    }

    setVerse(null);
    setReferenceKo("");
    setReferenceEn("");
    setReferenceFr("");
    setVerseKo("");
    setVerseEn("");
    setVerseFr("");
    setIsEditMode(true);
  };

  // 주 이동 (암송 일요일 기준)
  const changeWeek = (weeks: number) => {
    const [year, month, day] = selectedRecitationDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + weeks * 7);
    setSelectedRecitationDate(getLocalDateString(date));
  };

  // 이번 주(다음 일요일) 암송인지 확인
  const isThisWeek = selectedRecitationDate === getNextSunday();

  // 일요일 날짜 포맷 (로컬 시간 기준) - "1월 12일 일요일" 형식
  const formatSundayKorean = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  // 현재 탭의 reference와 verse 가져오기
  const getCurrentReference = () => {
    switch (activeTab) {
      case "ko": return referenceKo;
      case "en": return referenceEn;
      case "fr": return referenceFr;
    }
  };

  const getCurrentVerse = () => {
    switch (activeTab) {
      case "ko": return verseKo;
      case "en": return verseEn;
      case "fr": return verseFr;
    }
  };

  const setCurrentReference = (value: string) => {
    switch (activeTab) {
      case "ko": setReferenceKo(value); break;
      case "en": setReferenceEn(value); break;
      case "fr": setReferenceFr(value); break;
    }
  };

  const setCurrentVerse = (value: string) => {
    switch (activeTab) {
      case "ko": setVerseKo(value); break;
      case "en": setVerseEn(value); break;
      case "fr": setVerseFr(value); break;
    }
  };

  // 언어별 입력 완료 상태
  const getLanguageStatus = (lang: Language) => {
    switch (lang) {
      case "ko": return referenceKo.trim() && verseKo.trim();
      case "en": return referenceEn.trim() && verseEn.trim();
      case "fr": return referenceFr.trim() && verseFr.trim();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-google-yellow" />
          암송 말씀 등록
        </h2>
      </div>

      {/* 일요일 날짜 선택 */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => changeWeek(-1)}
          className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center min-w-[200px]">
          <p className="text-xl font-black text-gray-800">
            {formatSundayKorean(selectedRecitationDate)}
          </p>
        </div>
        <button
          onClick={() => changeWeek(1)}
          className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        {!isThisWeek && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedRecitationDate(getNextSunday())}
          >
            이번 주로
          </Button>
        )}
      </div>

      {/* 메인 컨텐츠 */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-google-yellow" />
              {!verse ? "암송 말씀 등록" : isEditMode ? "암송 말씀 수정" : "암송 말씀"}
            </span>
            {verse && !isEditMode && (
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
            {verse && isEditMode && (
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
              {/* 언어 탭 */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                {(["ko", "en", "fr"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveTab(lang)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                      activeTab === lang
                        ? "bg-white text-gray-800 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span>{languageLabels[lang].name}</span>
                    {getLanguageStatus(lang) && (
                      <Check className="w-4 h-4 text-google-green" />
                    )}
                  </button>
                ))}
              </div>

              {/* 필수 표시 */}
              {activeTab === "ko" && (
                <p className="text-xs text-google-red font-bold">* 한국어는 필수 입력입니다</p>
              )}

              {/* 성경 구절 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  성경 구절 {activeTab === "ko" && "*"}
                </label>
                <Input
                  value={getCurrentReference()}
                  onChange={(e) => setCurrentReference(e.target.value)}
                  placeholder={
                    activeTab === "ko" ? "예: 요한복음 3:16" :
                    activeTab === "en" ? "e.g. John 3:16" :
                    "ex. Jean 3:16"
                  }
                />
              </div>

              {/* 말씀 내용 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  말씀 내용 {activeTab === "ko" && "*"}
                </label>
                <textarea
                  value={getCurrentVerse()}
                  onChange={(e) => setCurrentVerse(e.target.value)}
                  placeholder={
                    activeTab === "ko" ? "하나님이 세상을 이처럼 사랑하사..." :
                    activeTab === "en" ? "For God so loved the world..." :
                    "Car Dieu a tant aimé le monde..."
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-google-green/30 focus:border-google-green transition-all min-h-[150px] resize-none"
                />
              </div>

              {/* 저장 버튼 */}
              <Button
                onClick={handleSave}
                disabled={isSaving || !referenceKo.trim() || !verseKo.trim()}
                variant="green"
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
                    {verse ? "수정하기" : "등록하기"}
                  </span>
                )}
              </Button>
            </div>
          ) : (
            /* 미리보기 모드 */
            <div className="space-y-4">
              {referenceKo && verseKo && (
                <div className="p-6 bg-google-yellow/5 rounded-2xl shadow-sm">
                  <p className="text-2xl font-black text-google-yellow mb-3">{referenceKo}</p>
                  <p className="text-lg text-gray-700 whitespace-pre-wrap leading-relaxed">{verseKo}</p>
                </div>
              )}

              {referenceEn && verseEn && (
                <div className="p-6 bg-google-blue/5 rounded-2xl shadow-sm">
                  <p className="text-2xl font-black text-google-blue mb-3">{referenceEn}</p>
                  <p className="text-lg text-gray-700 whitespace-pre-wrap leading-relaxed">{verseEn}</p>
                </div>
              )}

              {referenceFr && verseFr && (
                <div className="p-6 bg-google-red/5 rounded-2xl shadow-sm">
                  <p className="text-2xl font-black text-google-red mb-3">{referenceFr}</p>
                  <p className="text-lg text-gray-700 whitespace-pre-wrap leading-relaxed">{verseFr}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
