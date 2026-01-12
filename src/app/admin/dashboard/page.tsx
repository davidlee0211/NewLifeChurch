"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface RecentQT {
  id: string;
  date: string;
  approved: boolean;
  created_at: string;
  student: {
    name: string;
  };
}

interface TeamWithTalent {
  id: string;
  name: string;
  color: string;
  totalTalent: number;
}

export default function AdminDashboard() {
  const { user, churchId } = useAuth();
  const [totalStudents, setTotalStudents] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(0);
  const [todayRecitation, setTodayRecitation] = useState(0);
  const [pendingQT, setPendingQT] = useState(0);
  const [recentQTs, setRecentQTs] = useState<RecentQT[]>([]);
  const [teams, setTeams] = useState<TeamWithTalent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const adminName = user?.name || "선생님";

  // 오늘 날짜
  const today = new Date();
  const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const formattedDate = `${today.getMonth() + 1}월 ${today.getDate()}일 ${dayNames[today.getDay()]}`;

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

      // 오늘(이번 주 일요일) 출석 인원
      const { count: attendanceCount } = await supabase
        .from("quest_records")
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId)
        .eq("type", "attendance")
        .eq("date", thisSunday)
        .eq("approved", true);

      setTodayAttendance(attendanceCount || 0);

      // 오늘(이번 주 일요일) 암송 완료
      const { count: recitationCount } = await supabase
        .from("quest_records")
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId)
        .eq("type", "recitation")
        .eq("date", thisSunday)
        .eq("approved", true);

      setTodayRecitation(recitationCount || 0);

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

      // 팀별 달란트 현황
      const { data: teamsData } = await supabase
        .from("teams")
        .select("id, name, color")
        .eq("church_id", churchId);

      if (teamsData) {
        const teamsWithTalent: TeamWithTalent[] = [];

        for (const t of teamsData) {
          const { data: studentsData } = await supabase
            .from("students")
            .select("talent")
            .eq("team_id", (t as { id: string }).id);

          const totalTalent = studentsData?.reduce(
            (sum, s) => sum + ((s as { talent: number }).talent || 0),
            0
          ) || 0;

          teamsWithTalent.push({
            ...(t as { id: string; name: string; color: string }),
            totalTalent,
          });
        }

        teamsWithTalent.sort((a, b) => b.totalTalent - a.totalTalent);
        setTeams(teamsWithTalent);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [churchId, thisSunday]);

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
  const maxTalent = Math.max(...teams.map((t) => t.totalTalent), 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <span className="text-3xl">⏳</span>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-google-blue">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-bold">전체 학생</p>
                <p className="text-3xl font-black text-gray-800 mt-1">{totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-google-green">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-bold">오늘 출석</p>
                <p className="text-3xl font-black text-google-green mt-1">
                  {todayAttendance}
                  <span className="text-lg text-gray-400">/{totalStudents}</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-google-yellow">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-bold">오늘 암송</p>
                <p className="text-3xl font-black text-google-yellow mt-1">
                  {todayRecitation}
                  <span className="text-lg text-gray-400">/{totalStudents}</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📖</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-google-red">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-bold">승인 대기 QT</p>
                <p className="text-3xl font-black text-google-red mt-1">{pendingQT}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📷</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 바로가기 버튼들 */}
      <div>
        <h3 className="text-lg font-black text-gray-800 mb-3">빠른 실행</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/admin/attendance">
            <Button variant="green" className="w-full h-auto py-4 flex-col gap-2" size="lg">
              <span className="text-2xl">✅</span>
              <span className="font-bold">출석 체크 시작</span>
            </Button>
          </Link>

          <Link href="/admin/qt-approval">
            <Button variant="red" className="w-full h-auto py-4 flex-col gap-2 relative" size="lg">
              <span className="text-2xl">📷</span>
              <span className="font-bold">QT 승인하기</span>
              {pendingQT > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-white text-google-red rounded-full flex items-center justify-center text-xs font-black border-2 border-google-red">
                  {pendingQT}
                </span>
              )}
            </Button>
          </Link>

          <Link href="/admin/games/team-picker">
            <Button variant="primary" className="w-full h-auto py-4 flex-col gap-2" size="lg">
              <span className="text-2xl">🎲</span>
              <span className="font-bold">팀 뽑기 게임</span>
            </Button>
          </Link>

          <Link href="/admin/games/quiz-board">
            <Button variant="yellow" className="w-full h-auto py-4 flex-col gap-2" size="lg">
              <span className="text-2xl">🎯</span>
              <span className="font-bold">퀴즈 게임</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 팀별 달란트 현황 */}
        {teams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🏆</span> 팀별 달란트 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {teams.map((team, index) => (
                  <li key={team.id} className="flex items-center gap-3">
                    <span className="text-lg w-6">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`}
                    </span>
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: team.color || "#4285F4" }}
                    />
                    <span className="w-16 text-sm font-bold text-gray-700 truncate">
                      {team.name}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(team.totalTalent / maxTalent) * 100}%`,
                          backgroundColor: team.color || "#4285F4",
                        }}
                      />
                    </div>
                    <span className="text-sm font-black text-gray-700 w-16 text-right">
                      {team.totalTalent} 🪙
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 최근 QT 제출 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>📝</span> 최근 QT 제출
              </span>
              <Link
                href="/admin/qt-approval"
                className="text-sm text-google-blue font-bold hover:underline"
              >
                전체 보기 →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentQTs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                아직 QT 제출이 없습니다.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentQTs.map((qt) => (
                  <li
                    key={qt.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border-2 border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          qt.approved
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}
                      >
                        <span className="text-lg">
                          {qt.approved ? "✅" : "⏳"}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">
                          {qt.student?.name || "알 수 없음"}
                        </p>
                        <p className="text-xs text-gray-500">{qt.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          qt.approved
                            ? "bg-green-100 text-google-green"
                            : "bg-red-100 text-google-red"
                        }`}
                      >
                        {qt.approved ? "승인됨" : "대기중"}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
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
