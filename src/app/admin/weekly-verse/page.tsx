"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

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
  const [selectedWeek, setSelectedWeek] = useState(getThisSunday());
  const [verse, setVerse] = useState<WeeklyVerse | null>(null);
  const [activeTab, setActiveTab] = useState<Language>("ko");

  // 다국어 상태
  const [referenceKo, setReferenceKo] = useState("");
  const [referenceEn, setReferenceEn] = useState("");
  const [referenceFr, setReferenceFr] = useState("");
  const [verseKo, setVerseKo] = useState("");
  const [verseEn, setVerseEn] = useState("");
  const [verseFr, setVerseFr] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recentVerses, setRecentVerses] = useState<WeeklyVerse[]>([]);

  // 이번 주 일요일 구하기
  function getThisSunday(): string {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff)).toISOString().split("T")[0];
  }

  // 선택한 주의 암송 말씀 로드
  useEffect(() => {
    const fetchVerse = async () => {
      if (!churchId) return;

      setIsLoading(true);

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
      }

      setIsLoading(false);
    };

    fetchVerse();
  }, [churchId, selectedWeek]);

  // 최근 암송 말씀 목록 로드
  useEffect(() => {
    const fetchRecentVerses = async () => {
      if (!churchId) return;

      const { data } = await supabase
        .from("weekly_verses")
        .select("*")
        .eq("church_id", churchId)
        .order("week_start", { ascending: false })
        .limit(8);

      if (data) {
        setRecentVerses(data as WeeklyVerse[]);
      }
    };

    fetchRecentVerses();
  }, [churchId, verse]);

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
  };

  // 주 이동
  const changeWeek = (weeks: number) => {
    const date = new Date(selectedWeek);
    date.setDate(date.getDate() + weeks * 7);
    setSelectedWeek(date.toISOString().split("T")[0]);
  };

  // 이번 주인지 확인
  const isThisWeek = selectedWeek === getThisSunday();

  // 날짜 포맷
  const formatWeekKorean = (dateStr: string) => {
    const date = new Date(dateStr);
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 6);
    return `${date.getMonth() + 1}/${date.getDate()} ~ ${endDate.getMonth() + 1}/${endDate.getDate()}`;
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
      {/* 주 선택 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeWeek(-1)}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 transition-colors"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-2xl font-black text-gray-800">
              {formatWeekKorean(selectedWeek)}
            </p>
            {isThisWeek && (
              <span className="text-xs bg-google-green text-white px-2 py-0.5 rounded font-bold">
                이번 주
              </span>
            )}
          </div>
          <button
            onClick={() => changeWeek(1)}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 transition-colors"
          >
            ›
          </button>
        </div>

        <Button
          variant="secondary"
          onClick={() => setSelectedWeek(getThisSunday())}
        >
          이번 주로 이동
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 암송 말씀 편집 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>📖</span>
                  {verse ? "암송 말씀 수정" : "암송 말씀 등록"}
                </span>
                {verse && (
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
                        <span>{languageLabels[lang].flag}</span>
                        <span className="hidden sm:inline">{languageLabels[lang].name}</span>
                        {getLanguageStatus(lang) && (
                          <span className="text-google-green">✓</span>
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

                  {/* 미리보기 - 모든 언어 */}
                  {(referenceKo || referenceEn || referenceFr) && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500 font-bold">미리보기</p>

                      {referenceKo && verseKo && (
                        <div className="p-4 bg-google-yellow/20 rounded-xl border-2 border-google-yellow">
                          <div className="flex items-center gap-2 mb-2">
                            <span>🇰🇷</span>
                            <span className="text-xs font-bold text-gray-500">한국어</span>
                          </div>
                          <p className="text-lg font-black text-gray-800 mb-1">{referenceKo}</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{verseKo}</p>
                        </div>
                      )}

                      {referenceEn && verseEn && (
                        <div className="p-4 bg-google-blue/10 rounded-xl border-2 border-google-blue/30">
                          <div className="flex items-center gap-2 mb-2">
                            <span>🇺🇸</span>
                            <span className="text-xs font-bold text-gray-500">English</span>
                          </div>
                          <p className="text-lg font-black text-gray-800 mb-1">{referenceEn}</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{verseEn}</p>
                        </div>
                      )}

                      {referenceFr && verseFr && (
                        <div className="p-4 bg-google-red/10 rounded-xl border-2 border-google-red/30">
                          <div className="flex items-center gap-2 mb-2">
                            <span>🇫🇷</span>
                            <span className="text-xs font-bold text-gray-500">Français</span>
                          </div>
                          <p className="text-lg font-black text-gray-800 mb-1">{referenceFr}</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{verseFr}</p>
                        </div>
                      )}
                    </div>
                  )}

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
                        <span className="animate-spin">⏳</span>
                        저장 중...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>💾</span>
                        {verse ? "수정하기" : "등록하기"}
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 최근 암송 말씀 목록 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📅</span> 최근 암송 말씀
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentVerses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  등록된 암송 말씀이 없습니다.
                </p>
              ) : (
                <ul className="space-y-2">
                  {recentVerses.map((v) => {
                    const isSelected = v.week_start === selectedWeek;
                    const hasEn = v.reference_en && v.verse_en;
                    const hasFr = v.reference_fr && v.verse_fr;

                    return (
                      <li key={v.id}>
                        <button
                          onClick={() => setSelectedWeek(v.week_start)}
                          className={`w-full text-left p-3 rounded-xl transition-all ${
                            isSelected
                              ? "bg-google-green text-white"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <p className={`text-xs font-bold ${isSelected ? "text-white/80" : "text-gray-500"}`}>
                            {formatWeekKorean(v.week_start)}
                          </p>
                          <p className={`font-bold truncate ${isSelected ? "text-white" : "text-gray-800"}`}>
                            {v.reference_ko}
                          </p>
                          <div className="flex gap-1 mt-1">
                            <span className="text-xs">🇰🇷</span>
                            {hasEn && <span className="text-xs">🇺🇸</span>}
                            {hasFr && <span className="text-xs">🇫🇷</span>}
                          </div>
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
