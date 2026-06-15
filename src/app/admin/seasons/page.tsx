"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { invalidateCurrentSeasonCache } from "@/lib/seasons";
import type { Season, SeasonArchive } from "@/types/database";
import {
  Calendar,
  Trophy,
  Coins,
  Users,
  Loader2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";

interface StudentSnapshot {
  id: string;
  name: string;
  team_id: string | null;
  talent: number;
  team: { name: string; color: string } | null;
}

interface TeamSnapshot {
  id: string;
  name: string;
  color: string;
}

export default function SeasonsPage() {
  const { churchId } = useAuth();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [currentStudentCount, setCurrentStudentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const fetchData = useCallback(async () => {
    if (!churchId) return;
    setIsLoading(true);

    const { data: seasonsData } = await supabase
      .from("seasons")
      .select("*")
      .eq("church_id", churchId)
      .order("season_number", { ascending: false });

    const list = (seasonsData as Season[]) || [];
    setSeasons(list);
    const active = list.find((s) => !s.ended_at) || null;
    setCurrentSeason(active);

    const { data: studentsData } = await supabase
      .from("students")
      .select("talent")
      .eq("church_id", churchId);

    if (studentsData) {
      const rows = studentsData as { talent: number }[];
      setCurrentStudentCount(rows.length);
      setCurrentTotal(rows.reduce((sum, s) => sum + (s.talent || 0), 0));
    }

    setIsLoading(false);
  }, [churchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 시즌 종료 + 새 시즌 시작
  const handleEndSeasonAndStartNew = async () => {
    if (!churchId || !currentSeason) return;
    setIsProcessing(true);

    try {
      // 1. 현재 시점 스냅샷 만들기
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, name, team_id, talent, team:teams(id, name, color)")
        .eq("church_id", churchId)
        .order("talent", { ascending: false });

      const { data: teamsData } = await supabase
        .from("teams")
        .select("id, name, color")
        .eq("church_id", churchId);

      const students = (studentsData as unknown as StudentSnapshot[]) || [];
      const teams = (teamsData as TeamSnapshot[]) || [];

      const teamTotals = new Map<string, { total: number; count: number }>();
      for (const s of students) {
        if (!s.team_id) continue;
        const cur = teamTotals.get(s.team_id) || { total: 0, count: 0 };
        cur.total += s.talent;
        cur.count += 1;
        teamTotals.set(s.team_id, cur);
      }

      const archive: SeasonArchive = {
        ended_at: new Date().toISOString(),
        total_talent: students.reduce((sum, s) => sum + s.talent, 0),
        student_count: students.length,
        students: students.map((s) => ({
          id: s.id,
          name: s.name,
          team_id: s.team_id,
          team_name: s.team?.name || null,
          talent: s.talent,
        })),
        teams: teams.map((t) => {
          const stats = teamTotals.get(t.id) || { total: 0, count: 0 };
          return {
            id: t.id,
            name: t.name,
            color: t.color,
            total_talent: stats.total,
            member_count: stats.count,
          };
        }),
      };

      // 2. 현재 시즌 종료 처리
      const { error: endError } = await supabase
        .from("seasons")
        .update({
          ended_at: archive.ended_at,
          archived_data: archive,
        } as never)
        .eq("id", currentSeason.id);
      if (endError) throw endError;

      // 3. 새 시즌 생성
      const nextNumber = currentSeason.season_number + 1;
      const { error: newError } = await supabase
        .from("seasons")
        .insert({
          church_id: churchId,
          season_number: nextNumber,
          name: `시즌 ${nextNumber}`,
          started_at: new Date().toISOString(),
        } as never);
      if (newError) throw newError;

      // 4. 모든 학생 달란트 0 + 팀 소속 초기화
      const { error: resetError } = await supabase
        .from("students")
        .update({ talent: 0, team_id: null } as never)
        .eq("church_id", churchId);
      if (resetError) throw resetError;

      invalidateCurrentSeasonCache(churchId);
      alert(`시즌 ${currentSeason.season_number}이(가) 종료되고 시즌 ${nextNumber}이(가) 시작되었습니다.`);
      setShowConfirmModal(false);
      setConfirmText("");
      await fetchData();
    } catch (error) {
      console.error("Season end error:", error);
      alert("시즌 종료 처리 중 오류가 발생했습니다. 데이터 상태를 확인해주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("ko-KR");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Calendar className="w-6 h-6 text-google-blue" /> 시즌 관리
        </h2>
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
          <p className="text-gray-500 mt-4 font-bold">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-google-blue" />
        시즌 관리
      </h2>

      {/* 현재 시즌 카드 */}
      {currentSeason && (
        <Card className="rounded-2xl shadow-md border-2 border-google-blue/30">
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-google-blue" />
              진행 중인 시즌
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-gray-800">{currentSeason.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  시작: {formatDate(currentSeason.started_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">현재 총 달란트</p>
                <p className="text-2xl font-black text-google-yellow flex items-center gap-1 justify-end">
                  {currentTotal.toLocaleString()}
                  <Coins className="w-5 h-5" />
                </p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                  <Users className="w-3 h-3" />
                  학생 {currentStudentCount}명
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <Button
                onClick={() => setShowConfirmModal(true)}
                variant="red"
                className="w-full rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                시즌 종료하고 새 시즌 시작
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                모든 학생의 달란트와 팀 소속이 초기화되며, 현재 점수는 시즌 기록으로 저장됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 지난 시즌 목록 */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader className="px-3 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            지난 시즌
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {seasons.filter((s) => s.ended_at).length === 0 ? (
            <p className="text-center py-6 text-gray-500 text-sm">
              아직 종료된 시즌이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {seasons
                .filter((s) => s.ended_at)
                .map((season) => {
                  const isOpen = expandedId === season.id;
                  const archive = season.archived_data;
                  return (
                    <div key={season.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedId(isOpen ? null : season.id)}
                        className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-left">
                          <p className="font-bold text-gray-800">{season.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(season.started_at)} ~ {formatDate(season.ended_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {archive && (
                            <span className="text-google-yellow font-bold flex items-center gap-1 text-sm">
                              {archive.total_talent.toLocaleString()}
                              <Coins className="w-4 h-4" />
                            </span>
                          )}
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {isOpen && archive && (
                        <div className="px-3 sm:px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
                          {/* 팀 랭킹 */}
                          {archive.teams.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-bold text-gray-600 mb-2">팀 순위</p>
                              <div className="space-y-1">
                                {[...archive.teams]
                                  .sort((a, b) => b.total_talent - a.total_talent)
                                  .map((team, i) => (
                                    <div
                                      key={team.id}
                                      className="flex items-center justify-between p-2 bg-white rounded-lg"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xs font-bold w-5 flex-shrink-0">
                                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                                        </span>
                                        <span
                                          className="w-2 h-2 rounded-full flex-shrink-0"
                                          style={{ backgroundColor: team.color }}
                                        />
                                        <span className="text-sm font-bold text-gray-800 truncate">
                                          {team.name}
                                        </span>
                                        <span className="text-xs text-gray-500 flex-shrink-0">
                                          ({team.member_count}명)
                                        </span>
                                      </div>
                                      <span className="font-bold text-google-yellow flex items-center gap-0.5 text-sm flex-shrink-0">
                                        {team.total_talent.toLocaleString()}
                                        <Coins className="w-3 h-3" />
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* 학생 랭킹 (상위 10명) */}
                          <div className="mt-4">
                            <p className="text-xs font-bold text-gray-600 mb-2">
                              학생 순위 (상위 10명)
                            </p>
                            <div className="space-y-1">
                              {[...archive.students]
                                .sort((a, b) => b.talent - a.talent)
                                .slice(0, 10)
                                .map((student, i) => (
                                  <div
                                    key={student.id}
                                    className="flex items-center justify-between p-2 bg-white rounded-lg"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-xs font-bold w-5 flex-shrink-0">
                                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                                      </span>
                                      <span className="text-sm font-bold text-gray-800 truncate">
                                        {student.name}
                                      </span>
                                      {student.team_name && (
                                        <span className="text-xs text-gray-500 truncate">
                                          {student.team_name}
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-bold text-google-yellow flex items-center gap-0.5 text-sm flex-shrink-0">
                                      {student.talent.toLocaleString()}
                                      <Coins className="w-3 h-3" />
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 확인 모달 */}
      {showConfirmModal && currentSeason && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full rounded-2xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-google-red">
                <AlertTriangle className="w-5 h-5" />
                정말 시즌을 종료하시겠습니까?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-900 space-y-1">
                <p className="font-bold">다음 작업이 실행됩니다:</p>
                <ul className="list-disc ml-5 text-xs space-y-0.5">
                  <li>{currentSeason.name}의 학생/팀 점수가 스냅샷으로 저장</li>
                  <li>모든 학생의 현재 달란트가 0으로 초기화</li>
                  <li>모든 학생의 팀 소속이 해제됨 (팀뽑기로 재배정 필요)</li>
                  <li>시즌 {currentSeason.season_number + 1} 자동 시작</li>
                  <li>출석/암송/QT/거래 기록은 보존되며 시즌 {currentSeason.season_number} 기록으로 표시</li>
                </ul>
              </div>
              <p className="text-gray-700">
                계속하려면 아래 칸에 <strong>종료</strong> 라고 입력해주세요.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="종료"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-google-blue outline-none text-sm"
                autoFocus
              />
              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmText("");
                  }}
                  disabled={isProcessing}
                  className="flex-1 rounded-xl"
                >
                  취소
                </Button>
                <Button
                  variant="red"
                  onClick={handleEndSeasonAndStartNew}
                  disabled={isProcessing || confirmText !== "종료"}
                  className="flex-1 rounded-xl"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "시즌 종료"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
