"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface QuestRecord {
  id: string;
  type: string;
  date: string;
  talent_earned: number;
  approved: boolean;
}

interface Team {
  id: string;
  name: string;
  color: string;
}

interface TalentSetting {
  quest_type: string;
  amount: number;
}

interface WeeklyVerse {
  id: string;
  reference_ko: string;
  reference_en: string | null;
  reference_fr: string | null;
  verse_ko: string;
  verse_en: string | null;
  verse_fr: string | null;
}

export default function StudentDashboard() {
  const { user, churchId } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [weeklyRecords, setWeeklyRecords] = useState<QuestRecord[]>([]);
  const [talentSettings, setTalentSettings] = useState<TalentSetting[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthRecords, setMonthRecords] = useState<QuestRecord[]>([]);
  const [weeklyVerse, setWeeklyVerse] = useState<WeeklyVerse | null>(null);

  const studentName = user?.name || "친구";
  const talent = (user as { talent?: number })?.talent || 0;
  const teamId = (user as { team_id?: string })?.team_id;

  // 이번 주 일요일 구하기
  const getThisSunday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  };

  // 날짜 포맷 (YYYY-MM-DD)
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // 이번 달 날짜들 구하기
  const getMonthDates = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dates = [];

    // 첫째 주 빈 칸
    for (let i = 0; i < firstDay.getDay(); i++) {
      dates.push(null);
    }

    // 날짜들
    for (let i = 1; i <= lastDay.getDate(); i++) {
      dates.push(new Date(year, month, i));
    }

    return dates;
  };

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !churchId) return;

      // 팀 정보
      if (teamId) {
        const { data: teamData } = await supabase
          .from("teams")
          .select("*")
          .eq("id", teamId)
          .single();
        if (teamData) setTeam(teamData as Team);
      }

      // 이번 주 퀘스트 기록
      const sunday = getThisSunday();
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);

      const { data: recordsData } = await supabase
        .from("quest_records")
        .select("*")
        .eq("student_id", user.id)
        .gte("date", formatDate(sunday))
        .lte("date", formatDate(saturday));

      if (recordsData) setWeeklyRecords(recordsData as QuestRecord[]);

      // 이번 달 퀘스트 기록
      const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const { data: monthData } = await supabase
        .from("quest_records")
        .select("*")
        .eq("student_id", user.id)
        .gte("date", formatDate(monthStart))
        .lte("date", formatDate(monthEnd));

      if (monthData) setMonthRecords(monthData as QuestRecord[]);

      // 달란트 설정
      const { data: settingsData } = await supabase
        .from("talent_settings")
        .select("*")
        .eq("church_id", churchId);

      if (settingsData) setTalentSettings(settingsData as TalentSetting[]);

      // 이번 주 암송 말씀
      const { data: verseData } = await supabase
        .from("weekly_verses")
        .select("id, reference_ko, reference_en, reference_fr, verse_ko, verse_en, verse_fr")
        .eq("church_id", churchId)
        .eq("week_start", formatDate(sunday))
        .single();

      if (verseData) setWeeklyVerse(verseData as WeeklyVerse);
    };

    fetchData();
  }, [user?.id, churchId, teamId, selectedDate]);

  // 퀘스트 완료 여부 확인
  const isQuestCompleted = (type: string, date?: string) => {
    const targetDate = date || formatDate(new Date());
    return weeklyRecords.some(
      (r) => r.type === type && r.date === targetDate && r.approved
    );
  };

  // 해당 날짜에 QT 기록이 있는지
  const hasQTRecord = (date: Date) => {
    return monthRecords.some(
      (r) => r.type === "qt" && r.date === formatDate(date) && r.approved
    );
  };

  // 달란트 금액 가져오기
  const getTalentAmount = (type: string) => {
    return talentSettings.find((s) => s.quest_type === type)?.amount || 0;
  };

  // 이번 주 일요일 체크
  const thisSunday = formatDate(getThisSunday());
  const today = formatDate(new Date());

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="space-y-4">
      {/* 인사 메시지 + 팀 뱃지 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">
            {studentName} 친구, 안녕! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">오늘도 하나님과 함께!</p>
        </div>
        {team && (
          <div
            className="px-4 py-2 rounded-lg font-black text-white border-b-4"
            style={{
              backgroundColor: team.color || "#4285F4",
              borderColor: `${team.color || "#4285F4"}dd`,
            }}
          >
            {team.name}
          </div>
        )}
      </div>

      {/* 달란트 카드 */}
      <Card className="bg-google-yellow border-b-4 border-yellow-500">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-800 font-bold text-sm">내 달란트</p>
              <p className="text-4xl font-black text-gray-800 mt-1">{talent}</p>
            </div>
            <div className="w-20 h-20 bg-white/30 rounded-2xl flex items-center justify-center">
              <span className="text-5xl">🪙</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 이번 주 퀘스트 */}
      <div>
        <h2 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2">
          <span>📋</span> 이번 주 퀘스트
        </h2>

        <div className="space-y-3">
          {/* 출석 */}
          <Card className={`border-2 ${isQuestCompleted("attendance", thisSunday) ? "border-google-green bg-green-50" : "border-gray-200"}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isQuestCompleted("attendance", thisSunday) ? "bg-google-green" : "bg-gray-200"
                  }`}>
                    <span className="text-2xl">{isQuestCompleted("attendance", thisSunday) ? "✅" : "⬜"}</span>
                  </div>
                  <div>
                    <p className="font-black text-gray-800">출석</p>
                    <p className="text-xs text-gray-500">일요일 예배 출석</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black ${isQuestCompleted("attendance", thisSunday) ? "text-google-green" : "text-gray-400"}`}>
                    +{getTalentAmount("attendance")} 🪙
                  </p>
                  {isQuestCompleted("attendance", thisSunday) && (
                    <p className="text-xs text-google-green font-bold">완료!</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 이번 주 암송 말씀 */}
          {weeklyVerse && (
            <Card className="border-2 border-google-green bg-green-50">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">✝️</span>
                  <p className="font-black text-gray-800">이번 주 암송 말씀</p>
                </div>

                {/* 한국어 */}
                <div className="p-3 bg-white rounded-xl mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">🇰🇷</span>
                    <p className="font-black text-google-green text-sm">{weeklyVerse.reference_ko}</p>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{weeklyVerse.verse_ko}</p>
                </div>

                {/* 영어 */}
                {weeklyVerse.reference_en && weeklyVerse.verse_en && (
                  <div className="p-3 bg-white rounded-xl mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">🇺🇸</span>
                      <p className="font-black text-google-blue text-sm">{weeklyVerse.reference_en}</p>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{weeklyVerse.verse_en}</p>
                  </div>
                )}

                {/* 프랑스어 */}
                {weeklyVerse.reference_fr && weeklyVerse.verse_fr && (
                  <div className="p-3 bg-white rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">🇫🇷</span>
                      <p className="font-black text-google-red text-sm">{weeklyVerse.reference_fr}</p>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{weeklyVerse.verse_fr}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 암송 */}
          <Card className={`border-2 ${isQuestCompleted("recitation", thisSunday) ? "border-google-blue bg-blue-50" : "border-gray-200"}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isQuestCompleted("recitation", thisSunday) ? "bg-google-blue" : "bg-gray-200"
                  }`}>
                    <span className="text-2xl">{isQuestCompleted("recitation", thisSunday) ? "✅" : "📖"}</span>
                  </div>
                  <div>
                    <p className="font-black text-gray-800">암송</p>
                    <p className="text-xs text-gray-500">이번 주 성경 암송</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black ${isQuestCompleted("recitation", thisSunday) ? "text-google-blue" : "text-gray-400"}`}>
                    +{getTalentAmount("recitation")} 🪙
                  </p>
                  {isQuestCompleted("recitation", thisSunday) && (
                    <p className="text-xs text-google-blue font-bold">완료!</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QT */}
          <Card className={`border-2 ${isQuestCompleted("qt", today) ? "border-google-red bg-red-50" : "border-gray-200"}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isQuestCompleted("qt", today) ? "bg-google-red" : "bg-gray-200"
                  }`}>
                    <span className="text-2xl">{isQuestCompleted("qt", today) ? "✅" : "📝"}</span>
                  </div>
                  <div>
                    <p className="font-black text-gray-800">오늘의 QT</p>
                    <p className="text-xs text-gray-500">매일 말씀 묵상</p>
                  </div>
                </div>
                <div className="text-right">
                  {isQuestCompleted("qt", today) ? (
                    <>
                      <p className="font-black text-google-red">+{getTalentAmount("qt")} 🪙</p>
                      <p className="text-xs text-google-red font-bold">완료!</p>
                    </>
                  ) : (
                    <Link href="/student/qt-upload">
                      <Button size="sm" variant="red">
                        📷 인증하기
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QT 달력 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <span>📅</span> QT 달력
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200"
            >
              ‹
            </button>
            <span className="font-black text-gray-800">
              {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
            </span>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200"
            >
              ›
            </button>
          </div>
        </div>

        <Card className="border-2 border-gray-200">
          <CardContent className="py-4">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day, i) => (
                <div
                  key={day}
                  className={`text-center text-xs font-bold py-1 ${
                    i === 0 ? "text-google-red" : "text-gray-500"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜들 */}
            <div className="grid grid-cols-7 gap-1">
              {getMonthDates().map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const isToday = formatDate(date) === today;
                const hasQT = hasQTRecord(date);
                const isSundayDate = date.getDay() === 0;

                return (
                  <div
                    key={formatDate(date)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative ${
                      isToday
                        ? "bg-google-blue text-white font-black"
                        : isSundayDate
                        ? "text-google-red font-bold"
                        : "text-gray-700"
                    }`}
                  >
                    <span>{date.getDate()}</span>
                    {hasQT && (
                      <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isToday ? "bg-white" : "bg-google-green"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* 범례 */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-google-green" />
                <span>QT 완료</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-4 h-4 rounded bg-google-blue" />
                <span>오늘</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 이번 주 요약 */}
      <Card className="bg-gray-50 border-2 border-gray-200">
        <CardContent className="py-4">
          <h3 className="font-black text-gray-800 mb-3">이번 주 요약</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-3 text-center border-2 border-gray-100">
              <p className="text-2xl font-black text-google-green">
                {weeklyRecords.filter((r) => r.approved).length}
              </p>
              <p className="text-xs text-gray-500 font-bold">완료 퀘스트</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border-2 border-gray-100">
              <p className="text-2xl font-black text-google-blue">
                {weeklyRecords.filter((r) => r.type === "qt" && r.approved).length}
              </p>
              <p className="text-xs text-gray-500 font-bold">QT 횟수</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border-2 border-gray-100">
              <p className="text-2xl font-black text-google-yellow">
                +{weeklyRecords.filter((r) => r.approved).reduce((sum, r) => sum + r.talent_earned, 0)}
              </p>
              <p className="text-xs text-gray-500 font-bold">획득 달란트</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
