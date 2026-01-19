"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Coins,
  Cross,
  ClipboardList,
  CheckCircle,
  Square,
  BookOpen,
  FileText,
  Camera,
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Hand,
  Dices
} from "lucide-react";

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

interface TalentLog {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export default function StudentDashboard() {
  const { user, churchId } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [weeklyRecords, setWeeklyRecords] = useState<QuestRecord[]>([]);
  const [talentSettings, setTalentSettings] = useState<TalentSetting[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthRecords, setMonthRecords] = useState<QuestRecord[]>([]);
  const [weeklyVerse, setWeeklyVerse] = useState<WeeklyVerse | null>(null);
  const [weeklyQuizTalent, setWeeklyQuizTalent] = useState(0);

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

  // 날짜 포맷 (YYYY-MM-DD) - 로컬 시간 기준
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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

      // 이번 주 퀴즈 달란트 (바이블다이스)
      const { data: quizTalentData } = await supabase
        .from("talent_logs")
        .select("amount")
        .eq("student_id", user.id)
        .gte("created_at", sunday.toISOString())
        .like("reason", "%바이블다이스%");

      if (quizTalentData) {
        const total = (quizTalentData as TalentLog[]).reduce((sum, log) => sum + log.amount, 0);
        setWeeklyQuizTalent(total);
      }
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

  // 해당 날짜에 특정 타입 기록이 있는지
  const hasRecord = (date: Date, type: string) => {
    return monthRecords.some(
      (r) => r.type === type && r.date === formatDate(date) && r.approved
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
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            {studentName} 친구, 안녕! <Hand className="w-6 h-6 text-google-yellow" />
          </h1>
          <p className="text-gray-500 text-sm mt-1">오늘도 하나님과 함께!</p>
        </div>
        {team && (
          <div
            className="px-4 py-2 rounded-2xl font-black text-white shadow-md"
            style={{
              backgroundColor: team.color || "#4285F4",
            }}
          >
            {team.name}
          </div>
        )}
      </div>

      {/* 달란트 카드 */}
      <Card className="bg-gradient-to-br from-google-yellow to-yellow-400 rounded-2xl shadow-lg">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-800 font-bold text-sm">내 달란트</p>
              <p className="text-4xl font-black text-gray-800 mt-1">{talent}</p>
            </div>
            <div className="w-20 h-20 bg-white/30 rounded-2xl flex items-center justify-center shadow-inner">
              <Coins className="w-12 h-12 text-yellow-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 이번 주 요약 */}
      <div>
        <h2 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-google-red" /> 이번 주 요약
        </h2>
        <Card className="rounded-2xl shadow-md bg-gray-50">
          <CardContent className="py-4">
            <div className="grid grid-cols-5 gap-2">
            <div className={`bg-white rounded-2xl p-2 sm:p-3 text-center shadow-sm transition-all ${isQuestCompleted("attendance", thisSunday) ? "ring-2 ring-google-green" : ""}`}>
              <p className="text-xl sm:text-2xl font-black text-google-green flex justify-center">
                {isQuestCompleted("attendance", thisSunday) ? (
                  <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                ) : (
                  <Square className="w-6 h-6 sm:w-7 sm:h-7 text-gray-300" />
                )}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-1">출석</p>
            </div>
            <div className={`bg-white rounded-2xl p-2 sm:p-3 text-center shadow-sm transition-all ${isQuestCompleted("recitation", thisSunday) ? "ring-2 ring-google-yellow" : ""}`}>
              <p className="text-xl sm:text-2xl font-black text-google-yellow flex justify-center">
                {isQuestCompleted("recitation", thisSunday) ? (
                  <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                ) : (
                  <Square className="w-6 h-6 sm:w-7 sm:h-7 text-gray-300" />
                )}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-1">암송</p>
            </div>
            <div className={`bg-white rounded-2xl p-2 sm:p-3 text-center shadow-sm transition-all ${weeklyQuizTalent > 0 ? "ring-2 ring-google-blue" : ""}`}>
              <p className="text-xl sm:text-2xl font-black text-google-blue">
                +{weeklyQuizTalent}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-1">퀴즈</p>
            </div>
            <div className="bg-white rounded-2xl p-2 sm:p-3 text-center shadow-sm">
              <p className="text-xl sm:text-2xl font-black text-google-red">
                {weeklyRecords.filter((r) => r.type === "qt" && r.approved).length}/6
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 font-bold">QT</p>
            </div>
            <div className="bg-white rounded-2xl p-2 sm:p-3 text-center shadow-sm">
              <p className="text-xl sm:text-2xl font-black text-purple-600">
                +{weeklyRecords.filter((r) => r.approved).reduce((sum, r) => sum + r.talent_earned, 0) + weeklyQuizTalent}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 font-bold">총합</p>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 이번 주 암송 말씀 */}
      {weeklyVerse && (
        <div>
          <h2 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2">
            <Cross className="w-5 h-5 text-google-blue" /> 이번 주 암송 말씀
          </h2>
          <Card className="rounded-2xl shadow-md bg-google-yellow/5">
            <CardContent className="py-4">
              {/* 한국어 */}
              <div className="p-4 bg-white rounded-2xl mb-2 shadow-sm">
                <p className="font-black text-google-yellow text-base mb-2">{weeklyVerse.reference_ko}</p>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{weeklyVerse.verse_ko}</p>
              </div>

              {/* 영어 */}
              {weeklyVerse.reference_en && weeklyVerse.verse_en && (
                <div className="p-4 bg-white rounded-2xl mb-2 shadow-sm">
                  <p className="font-black text-google-blue text-base mb-2">{weeklyVerse.reference_en}</p>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{weeklyVerse.verse_en}</p>
                </div>
              )}

              {/* 프랑스어 */}
              {weeklyVerse.reference_fr && weeklyVerse.verse_fr && (
                <div className="p-4 bg-white rounded-2xl shadow-sm">
                  <p className="font-black text-google-red text-base mb-2">{weeklyVerse.reference_fr}</p>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{weeklyVerse.verse_fr}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 이번 주 퀘스트 */}
      <div>
        <h2 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-google-green" /> 이번 주 퀘스트
        </h2>

        <div className="space-y-3">
          {/* 출석 */}
          <Card className={`rounded-2xl shadow-md transition-all ${isQuestCompleted("attendance", thisSunday) ? "bg-google-green/5" : "bg-white"}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isQuestCompleted("attendance", thisSunday) ? "bg-google-green" : "bg-gray-100"
                  }`}>
                    {isQuestCompleted("attendance", thisSunday) ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <Square className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-black text-gray-800">출석</p>
                    <p className="text-xs text-gray-500">일요일 예배 출석</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black flex items-center justify-end gap-1 ${isQuestCompleted("attendance", thisSunday) ? "text-google-green" : "text-gray-400"}`}>
                    +{getTalentAmount("attendance")} <Coins className="w-4 h-4" />
                  </p>
                  {isQuestCompleted("attendance", thisSunday) && (
                    <span className="text-xs text-white font-bold bg-google-green px-2 py-0.5 rounded-full">완료!</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 암송 */}
          <Card className={`rounded-2xl shadow-md transition-all ${isQuestCompleted("recitation", thisSunday) ? "bg-google-yellow/5" : "bg-white"}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isQuestCompleted("recitation", thisSunday) ? "bg-google-yellow" : "bg-gray-100"
                  }`}>
                    {isQuestCompleted("recitation", thisSunday) ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-black text-gray-800">암송</p>
                    <p className="text-xs text-gray-500">이번 주 성경 암송</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black flex items-center justify-end gap-1 ${isQuestCompleted("recitation", thisSunday) ? "text-google-yellow" : "text-gray-400"}`}>
                    +{getTalentAmount("recitation")} <Coins className="w-4 h-4" />
                  </p>
                  {isQuestCompleted("recitation", thisSunday) && (
                    <span className="text-xs text-white font-bold bg-google-yellow px-2 py-0.5 rounded-full">완료!</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 퀴즈 (바이블다이스) */}
          <Card className={`rounded-2xl shadow-md transition-all ${weeklyQuizTalent > 0 ? "bg-google-blue/5" : "bg-white"}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    weeklyQuizTalent > 0 ? "bg-google-blue" : "bg-gray-100"
                  }`}>
                    <Dices className={`w-6 h-6 ${weeklyQuizTalent > 0 ? "text-white" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-black text-gray-800">퀴즈</p>
                    <p className="text-xs text-gray-500">바이블다이스 게임</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black flex items-center justify-end gap-1 ${weeklyQuizTalent > 0 ? "text-google-blue" : "text-gray-400"}`}>
                    +{weeklyQuizTalent} <Coins className="w-4 h-4" />
                  </p>
                  {weeklyQuizTalent > 0 && (
                    <span className="text-xs text-white font-bold bg-google-blue px-2 py-0.5 rounded-full">획득!</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QT - 월~토 6칸 */}
          <Card className="rounded-2xl shadow-md bg-white">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-google-red">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-gray-800">매일 QT</p>
                    <p className="text-xs text-gray-500">월-토 매일 말씀 묵상</p>
                  </div>
                </div>
                <Link href="/student/qt-upload">
                  <Button size="sm" variant="red" className="rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1">
                    <Camera className="w-4 h-4" /> 인증
                  </Button>
                </Link>
              </div>
              {/* 월-토 6칸 */}
              <div className="grid grid-cols-6 gap-2">
                {(() => {
                  const sunday = getThisSunday();
                  const days = ["월", "화", "수", "목", "금", "토"];
                  return days.map((day, index) => {
                    const date = new Date(sunday);
                    date.setDate(sunday.getDate() + index + 1); // 월요일부터
                    const dateStr = formatDate(date);
                    const isCompleted = weeklyRecords.some(
                      (r) => r.type === "qt" && r.date === dateStr && r.approved
                    );
                    const isCurrentDay = dateStr === today;
                    return (
                      <div
                        key={day}
                        className={`flex flex-col items-center p-2 rounded-2xl transition-all ${
                          isCompleted
                            ? "bg-google-red/10 shadow-sm"
                            : isCurrentDay
                            ? "bg-google-blue/10 shadow-sm"
                            : "bg-gray-50"
                        }`}
                      >
                        <span className={`text-xs font-bold ${isCurrentDay ? "text-google-blue" : "text-gray-500"}`}>
                          {day}
                        </span>
                        <span className="mt-1">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-google-red" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-300" />
                          )}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="mt-3 text-right">
                <p className="text-sm text-gray-500 flex items-center justify-end gap-1">
                  완료: <span className="font-black text-google-red">{weeklyRecords.filter((r) => r.type === "qt" && r.approved).length}</span>/6
                  <span className="ml-2 flex items-center gap-0.5">+{getTalentAmount("qt")} <Coins className="w-3 h-3" />/일</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 달력 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-google-blue" /> 달력
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-black text-gray-800">
              {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
            </span>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Card className="rounded-2xl shadow-md bg-white">
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
                const isSundayDate = date.getDay() === 0;
                const hasAttendance = hasRecord(date, "attendance");
                const hasRecitation = hasRecord(date, "recitation");
                const hasQT = hasRecord(date, "qt");

                return (
                  <div
                    key={formatDate(date)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-all ${
                      isToday
                        ? "bg-google-blue text-white font-black shadow-md"
                        : isSundayDate
                        ? "text-google-red font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{date.getDate()}</span>
                    {(hasAttendance || hasRecitation || hasQT) && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {hasAttendance && (
                          <div className={`w-1.5 h-1.5 rounded-full ${isToday ? "bg-white" : "bg-google-green"}`} />
                        )}
                        {hasRecitation && (
                          <div className={`w-1.5 h-1.5 rounded-full ${isToday ? "bg-white" : "bg-google-yellow"}`} />
                        )}
                        {hasQT && (
                          <div className={`w-1.5 h-1.5 rounded-full ${isToday ? "bg-white" : "bg-google-red"}`} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 범례 */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full bg-google-green" />
                <span>출석</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full bg-google-yellow" />
                <span>암송</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full bg-google-red" />
                <span>QT</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
