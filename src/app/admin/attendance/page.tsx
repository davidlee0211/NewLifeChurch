"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Student, Team } from "@/types/database";
import { CheckCircle, UserCheck, UserX, BookOpen, Users, List, User, Save, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface StudentWithTeam extends Student {
  team: Team | null;
}

interface CheckStudent extends StudentWithTeam {
  isPresent: boolean;
  hasAttendanceRecord: boolean;
  isRecited: boolean;
  hasRecitationRecord: boolean;
}

export default function AttendancePage() {
  const { churchId } = useAuth();
  const [students, setStudents] = useState<CheckStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 로컬 시간 기준 날짜 (YYYY-MM-DD)
  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 이번 주 일요일 찾기 (일-토 기준, 오늘이 일요일이면 오늘, 아니면 지난 일요일)
  const getThisSunday = (date: Date = new Date()) => {
    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0 = 일요일
    d.setDate(d.getDate() - dayOfWeek); // 이번 주 일요일로 이동
    return d;
  };

  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString(getThisSunday()));

  // 날짜 포맷 (로컬 시간 기준)
  const formatDateKorean = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  // 일요일 이동 (이전/다음 주)
  const changeSunday = (weeks: number) => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + weeks * 7);
    setSelectedDate(getLocalDateString(date));
  };

  // 오늘(가장 가까운 일요일)인지 확인
  const isThisSunday = selectedDate === getLocalDateString(getThisSunday());

  // 학생 목록 및 출석/암송 기록 로드
  useEffect(() => {
    const fetchData = async () => {
      if (!churchId) return;

      setIsLoading(true);

      // 학생 목록 가져오기
      const { data: studentsData } = await supabase
        .from("students")
        .select("*, team:teams(*)")
        .eq("church_id", churchId)
        .order("name", { ascending: true });

      if (!studentsData) {
        setIsLoading(false);
        return;
      }

      // 해당 날짜 출석 기록 가져오기
      const { data: attendanceData } = await supabase
        .from("quest_records")
        .select("student_id")
        .eq("church_id", churchId)
        .eq("type", "attendance")
        .eq("date", selectedDate);

      // 해당 날짜 암송 기록 가져오기
      const { data: recitationData } = await supabase
        .from("quest_records")
        .select("student_id")
        .eq("church_id", churchId)
        .eq("type", "recitation")
        .eq("date", selectedDate);

      const attendanceIds = new Set(
        (attendanceData || []).map((r) => (r as { student_id: string }).student_id)
      );
      const recitationIds = new Set(
        (recitationData || []).map((r) => (r as { student_id: string }).student_id)
      );

      // 학생 데이터에 출석/암송 상태 추가
      const studentsWithCheck: CheckStudent[] = (
        studentsData as StudentWithTeam[]
      ).map((student) => ({
        ...student,
        isPresent: attendanceIds.has(student.id),
        hasAttendanceRecord: attendanceIds.has(student.id),
        isRecited: recitationIds.has(student.id),
        hasRecitationRecord: recitationIds.has(student.id),
      }));

      setStudents(studentsWithCheck);
      setIsLoading(false);
    };

    fetchData();
  }, [churchId, selectedDate]);

  // 출석 토글
  const toggleAttendance = (id: string) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, isPresent: !student.isPresent } : student
      )
    );
  };

  // 암송 토글
  const toggleRecitation = (id: string) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, isRecited: !student.isRecited } : student
      )
    );
  };

  // 저장
  const handleSave = async () => {
    if (!churchId) return;

    setIsSaving(true);

    try {
      // 달란트 설정 가져오기
      const { data: settingsData } = await supabase
        .from("talent_settings")
        .select("quest_type, amount")
        .eq("church_id", churchId)
        .in("quest_type", ["attendance", "recitation"]);

      const settings = new Map(
        (settingsData || []).map((s) => [(s as { quest_type: string; amount: number }).quest_type, (s as { quest_type: string; amount: number }).amount])
      );
      const attendanceTalent = settings.get("attendance") || 1;
      const recitationTalent = settings.get("recitation") || 1;

      // 출석 변경 처리
      const newlyPresent = students.filter((s) => s.isPresent && !s.hasAttendanceRecord);
      const newlyAbsent = students.filter((s) => !s.isPresent && s.hasAttendanceRecord);

      // 암송 변경 처리
      const newlyRecited = students.filter((s) => s.isRecited && !s.hasRecitationRecord);
      const newlyUnrecited = students.filter((s) => !s.isRecited && s.hasRecitationRecord);

      // 새로 출석한 학생들 기록 추가
      if (newlyPresent.length > 0) {
        const records = newlyPresent.map((student) => ({
          student_id: student.id,
          church_id: churchId,
          type: "attendance" as const,
          date: selectedDate,
          talent_earned: attendanceTalent,
          approved: true,
        }));

        await supabase.from("quest_records").insert(records as never);

        // 달란트 지급
        for (const student of newlyPresent) {
          await supabase
            .from("students")
            .update({ talent: student.talent + attendanceTalent } as never)
            .eq("id", student.id);
        }
      }

      // 출석 취소된 학생들 처리
      if (newlyAbsent.length > 0) {
        for (const student of newlyAbsent) {
          await supabase
            .from("quest_records")
            .delete()
            .eq("student_id", student.id)
            .eq("church_id", churchId)
            .eq("type", "attendance")
            .eq("date", selectedDate);

          await supabase
            .from("students")
            .update({ talent: Math.max(0, student.talent - attendanceTalent) } as never)
            .eq("id", student.id);
        }
      }

      // 새로 암송한 학생들 기록 추가
      if (newlyRecited.length > 0) {
        const records = newlyRecited.map((student) => ({
          student_id: student.id,
          church_id: churchId,
          type: "recitation" as const,
          date: selectedDate,
          talent_earned: recitationTalent,
          approved: true,
        }));

        await supabase.from("quest_records").insert(records as never);

        // 달란트 지급
        for (const student of newlyRecited) {
          const currentTalent = newlyPresent.find((s) => s.id === student.id)
            ? student.talent + attendanceTalent
            : student.talent;
          await supabase
            .from("students")
            .update({ talent: currentTalent + recitationTalent } as never)
            .eq("id", student.id);
        }
      }

      // 암송 취소된 학생들 처리
      if (newlyUnrecited.length > 0) {
        for (const student of newlyUnrecited) {
          await supabase
            .from("quest_records")
            .delete()
            .eq("student_id", student.id)
            .eq("church_id", churchId)
            .eq("type", "recitation")
            .eq("date", selectedDate);

          const currentTalent = newlyAbsent.find((s) => s.id === student.id)
            ? Math.max(0, student.talent - attendanceTalent)
            : student.talent;
          await supabase
            .from("students")
            .update({ talent: Math.max(0, currentTalent - recitationTalent) } as never)
            .eq("id", student.id);
        }
      }

      // 상태 업데이트
      setStudents((prev) =>
        prev.map((student) => ({
          ...student,
          hasAttendanceRecord: student.isPresent,
          hasRecitationRecord: student.isRecited,
        }))
      );

      alert("저장되었습니다!");
    } catch (error) {
      console.error("Error:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = students.filter((s) => s.isPresent).length;
  const recitedCount = students.filter((s) => s.isRecited).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-google-green" />
          출석 · 암송 체크
        </h2>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
          <p className="text-gray-500 mt-4 font-bold">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-google-green" />
          <span className="hidden sm:inline">출석 · 암송 체크</span>
          <span className="sm:hidden">출석/암송</span>
        </h2>
        <Button size="lg" onClick={handleSave} disabled={isSaving} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">저장 중...</span>
              <span className="sm:hidden">저장중</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">저장하기</span>
              <span className="sm:hidden">저장</span>
            </>
          )}
        </Button>
      </div>

      {/* 일요일 날짜 선택 */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        <button
          onClick={() => changeSunday(-1)}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <div className="text-center min-w-[140px] sm:min-w-[200px]">
          <p className="text-base sm:text-xl font-black text-gray-800">
            {formatDateKorean(selectedDate)}
          </p>
        </div>
        <button
          onClick={() => changeSunday(1)}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        {!isThisSunday && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedDate(getLocalDateString(getThisSunday()))}
            className="text-xs sm:text-sm"
          >
            이번 주로
          </Button>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Card className="rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-shadow bg-white">
          <CardContent className="pt-3 sm:pt-6 px-2 sm:px-6">
            <div className="text-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto bg-google-green/10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-1 sm:mb-2">
                <UserCheck className="w-4 h-4 sm:w-6 sm:h-6 text-google-green" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-google-green">{presentCount}</p>
              <p className="text-gray-500 font-medium text-[10px] sm:text-sm">출석</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-shadow bg-white">
          <CardContent className="pt-3 sm:pt-6 px-2 sm:px-6">
            <div className="text-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto bg-google-red/10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-1 sm:mb-2">
                <UserX className="w-4 h-4 sm:w-6 sm:h-6 text-google-red" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-google-red">{students.length - presentCount}</p>
              <p className="text-gray-500 font-medium text-[10px] sm:text-sm">결석</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-shadow bg-white">
          <CardContent className="pt-3 sm:pt-6 px-2 sm:px-6">
            <div className="text-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto bg-google-yellow/10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-1 sm:mb-2">
                <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-google-yellow" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-google-yellow">{recitedCount}</p>
              <p className="text-gray-500 font-medium text-[10px] sm:text-sm">암송</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-shadow bg-white">
          <CardContent className="pt-3 sm:pt-6 px-2 sm:px-6">
            <div className="text-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto bg-google-blue/10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-1 sm:mb-2">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-google-blue" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-gray-800">{students.length}</p>
              <p className="text-gray-500 font-medium text-[10px] sm:text-sm">전체</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 학생 목록 */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader className="px-3 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <List className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            학생 목록
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {students.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              등록된 학생이 없습니다. 학생 관리에서 학생을 추가해주세요.
            </div>
          ) : (
            <>
              {/* 헤더 */}
              <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-100 rounded-lg sm:rounded-xl mb-2 sm:mb-3 font-bold text-gray-600 text-xs sm:text-sm">
                <span className="flex-1">학생</span>
                <div className="flex gap-2 sm:gap-4">
                  <span className="w-12 sm:w-16 text-center">출석</span>
                  <span className="w-12 sm:w-16 text-center">암송</span>
                </div>
              </div>

              {/* 학생 리스트 */}
              <ul className="space-y-1.5 sm:space-y-2">
                {students.map((student) => (
                  <li
                    key={student.id}
                    className={`flex items-center justify-between p-2 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 ${
                      student.isPresent || student.isRecited
                        ? "bg-gray-50 shadow-sm"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-google-blue/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-google-blue" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 truncate text-xs sm:text-sm">{student.name}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">{student.team?.name || "팀 없음"}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 sm:gap-4">
                      {/* 출석 체크 버튼 */}
                      <button
                        onClick={() => toggleAttendance(student.id)}
                        className={`w-12 h-8 sm:w-16 sm:h-10 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1 ${
                          student.isPresent
                            ? "bg-google-green text-white shadow-md"
                            : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                        }`}
                      >
                        {student.isPresent ? "✓" : "출석"}
                      </button>

                      {/* 암송 체크 버튼 */}
                      <button
                        onClick={() => toggleRecitation(student.id)}
                        className={`w-12 h-8 sm:w-16 sm:h-10 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1 ${
                          student.isRecited
                            ? "bg-google-yellow text-white shadow-md"
                            : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                        }`}
                      >
                        {student.isRecited ? "✓" : "암송"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
