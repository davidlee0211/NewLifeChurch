"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { CheckCircle, BookOpen, FileText, Clock, Zap, Trophy, Coins, Camera, Loader2 } from "lucide-react";

interface RecentQT {
  id: string;
  date: string;
  approved: boolean;
  created_at: string;
  student: {
    name: string;
  };
}

interface StudentWithTalent {
  id: string;
  name: string;
  talent: number;
  team_name?: string;
  team_color?: string;
}

export default function AdminDashboard() {
  const { user, churchId } = useAuth();
  const [totalStudents, setTotalStudents] = useState(0);
  const [weeklyAttendance, setWeeklyAttendance] = useState(0);
  const [weeklyRecitation, setWeeklyRecitation] = useState(0);
  const [todayQT, setTodayQT] = useState(0);
  const [pendingQT, setPendingQT] = useState(0);
  const [recentQTs, setRecentQTs] = useState<RecentQT[]>([]);
  const [students, setStudents] = useState<StudentWithTalent[]>([]);
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const adminName = user?.name || "선생님";

  // 오늘 날짜
  const today = new Date();
  const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const formattedDate = `${today.getMonth() + 1}월 ${today.getDate()}일 ${dayNames[today.getDay()]}`;

  // 오늘 날짜 문자열 (YYYY-MM-DD)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // 이번 주 일요일 구하기
  const getThisSunday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff)).toISOString().split("T")[0];
  };

  const thisSunday = getThisSunday();

  useEffect(() => {
    const fetchData = async () => {
      if (!churchId) {
        setIsLoading(false);
        return;
      }

      // 전체 학생 수
      const { count: studentCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId);

      setTotalStudents(studentCount || 0);

      // 이번 주 출석 인원
      const { count: attendanceCount } = await supabase
        .from("quest_records")
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId)
        .eq("type", "attendance")
        .eq("date", thisSunday)
        .eq("approved", true);

      setWeeklyAttendance(attendanceCount || 0);

      // 이번 주 암송 완료
      const { count: recitationCount } = await supabase
        .from("quest_records")
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId)
        .eq("type", "recitation")
        .eq("date", thisSunday)
        .eq("approved", true);

      setWeeklyRecitation(recitationCount || 0);

      // 오늘 QT 제출 수
      const { count: todayQTCount } = await supabase
        .from("quest_records")
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId)
        .eq("type", "qt")
        .eq("date", todayStr)
        .eq("approved", true);

      setTodayQT(todayQTCount || 0);

      // 승인 대기 QT 수
      const { count: pendingCount } = await supabase
        .from("quest_records")
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId)
        .eq("type", "qt")
        .eq("approved", false);

      setPendingQT(pendingCount || 0);

      // 최근 QT 제출 목록 (최신 5개)
      const { data: recentData } = await supabase
        .from("quest_records")
        .select(`
          id,
          date,
          approved,
          created_at,
          student:students(name)
        `)
        .eq("church_id", churchId)
        .eq("type", "qt")
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentData) {
        const formatted = (recentData as Array<{
          id: string;
          date: string;
          approved: boolean;
          created_at: string;
          student: { name: string } | { name: string }[];
        }>).map((r) => ({
          id: r.id,
          date: r.date,
          approved: r.approved,
          created_at: r.created_at,
          student: Array.isArray(r.student) ? r.student[0] : r.student,
        })) as RecentQT[];
        setRecentQTs(formatted);
      }

      // 학생별 달란트 현황
      const { data: studentsData } = await supabase
        .from("students")
        .select(`
          id,
          name,
          talent,
          team:teams(name, color)
        `)
        .eq("church_id", churchId)
        .order("talent", { ascending: false });

      if (studentsData) {
        const formatted = (studentsData as Array<{
          id: string;
          name: string;
          talent: number;
          team: { name: string; color: string } | { name: string; color: string }[] | null;
        }>).map((s) => {
          const team = Array.isArray(s.team) ? s.team[0] : s.team;
          return {
            id: s.id,
            name: s.name,
            talent: s.talent || 0,
            team_name: team?.name,
            team_color: team?.color,
          };
        });
        setStudents(formatted);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [churchId, thisSunday, todayStr]);

  // 상대 시간 표시
  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  // 최대 달란트 (프로그레스바 계산용)
  const maxTalent = Math.max(...students.map((s) => s.talent), 1);

  // 표시할 학생 목록 (3명 또는 전체)
  const displayStudents = showAllStudents ? students : students.slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
          <p className="text-gray-500 font-bold">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 인사 메시지 */}
      <div>
        <p className="text-gray-500 font-bold">{formattedDate}</p>
        <h2 className="text-2xl font-black text-gray-800 mt-1">
          {adminName} 선생님, 안녕하세요! 👋
        </h2>
      </div>

      {/* 요약 카드들 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow bg-white">
          <CardContent className="py-3 sm:py-5 px-3 sm:px-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-gray-500 text-[10px] sm:text-xs font-bold truncate">이번 주 출석</p>
                <p className="text-xl sm:text-3xl font-black text-google-green mt-1">
                  {weeklyAttendance}
                  <span className="text-sm sm:text-lg text-gray-400">/{totalStudents}</span>
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-google-green/10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-google-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow bg-white">
          <CardContent className="py-3 sm:py-5 px-3 sm:px-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-gray-500 text-[10px] sm:text-xs font-bold truncate">이번 주 암송</p>
                <p className="text-xl sm:text-3xl font-black text-google-yellow mt-1">
                  {weeklyRecitation}
                  <span className="text-sm sm:text-lg text-gray-400">/{totalStudents}</span>
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-google-yellow/10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-google-yellow" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow bg-white">
          <CardContent className="py-3 sm:py-5 px-3 sm:px-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-gray-500 text-[10px] sm:text-xs font-bold truncate">오늘 QT</p>
                <p className="text-xl sm:text-3xl font-black text-google-blue mt-1">{todayQT}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-google-blue/10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-google-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow bg-white">
          <CardContent className="py-3 sm:py-5 px-3 sm:px-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-gray-500 text-[10px] sm:text-xs font-bold truncate">승인 대기 QT</p>
                <p className="text-xl sm:text-3xl font-black text-google-red mt-1">{pendingQT}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-google-red/10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-google-red" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 바로가기 버튼들 */}
      <div>
        <h3 className="text-base sm:text-lg font-black text-gray-800 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-google-yellow" />
          빠른 실행
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Link href="/admin/attendance">
            <Button variant="green" className="w-full h-auto py-3 sm:py-4 flex flex-col items-center justify-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02]" size="lg">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-bold text-xs sm:text-sm">출석/암송 체크</span>
            </Button>
          </Link>

          <Link href="/admin/qt-topics">
            <Button variant="primary" className="w-full h-auto py-3 sm:py-4 flex flex-col items-center justify-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02]" size="lg">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-bold text-xs sm:text-sm">QT 주제 등록</span>
            </Button>
          </Link>

          <Link href="/admin/qt-approval">
            <Button variant="red" className="w-full h-auto py-3 sm:py-4 flex flex-col items-center justify-center gap-1 sm:gap-2 relative rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02]" size="lg">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-bold text-xs sm:text-sm">QT 승인</span>
              {pendingQT > 0 && (
                <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-white text-google-red rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black border-2 border-google-red shadow-md">
                  {pendingQT}
                </span>
              )}
            </Button>
          </Link>

          <Link href="/admin/talent">
            <Button variant="yellow" className="w-full h-auto py-3 sm:py-4 flex flex-col items-center justify-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02]" size="lg">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-bold text-xs sm:text-sm">달란트 관리</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* 학생 달란트 현황 */}
        {students.length > 0 && (
          <Card className="rounded-2xl shadow-md">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                <span className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-google-yellow" />
                  학생 달란트 현황
                </span>
                {students.length > 3 && (
                  <button
                    onClick={() => setShowAllStudents(!showAllStudents)}
                    className="text-xs sm:text-sm text-google-blue font-bold hover:underline transition-colors"
                  >
                    {showAllStudents ? "접기" : `전체 보기 (${students.length}명)`}
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <ul className="space-y-2 sm:space-y-3">
                {displayStudents.map((student, index) => (
                  <li key={student.id} className="flex items-center gap-2 sm:gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                    <span className="text-base sm:text-xl w-6 sm:w-8 text-center flex-shrink-0">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : <span className="text-gray-400 text-xs sm:text-sm font-bold">{index + 1}</span>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                          {student.name}
                        </span>
                        {student.team_name && (
                          <span
                            className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-lg font-bold text-white"
                            style={{ backgroundColor: student.team_color || "#4285F4" }}
                          >
                            {student.team_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 sm:h-3 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-google-yellow"
                            style={{
                              width: `${(student.talent / maxTalent) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm font-black text-gray-700 w-10 sm:w-14 text-right flex items-center justify-end gap-0.5 sm:gap-1">
                          {student.talent}
                          <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-google-yellow" />
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 최근 QT 제출 */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center justify-between text-sm sm:text-base">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-google-blue" />
                최근 QT 제출
              </span>
              <Link
                href="/admin/qt-approval"
                className="text-xs sm:text-sm text-google-blue font-bold hover:underline transition-colors"
              >
                전체 보기 →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {recentQTs.length === 0 ? (
              <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">
                아직 QT 제출이 없습니다.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentQTs.map((qt) => (
                  <li
                    key={qt.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-xl sm:rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                          qt.approved
                            ? "bg-google-green/10"
                            : "bg-google-red/10"
                        }`}
                      >
                        {qt.approved ? (
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-google-green" />
                        ) : (
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-google-red" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 text-xs sm:text-sm truncate">
                          {qt.student?.name || "알 수 없음"}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500">{qt.date}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span
                        className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${
                          qt.approved
                            ? "bg-google-green/10 text-google-green"
                            : "bg-google-red/10 text-google-red"
                        }`}
                      >
                        {qt.approved ? "승인됨" : "대기중"}
                      </span>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                        {getRelativeTime(qt.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
