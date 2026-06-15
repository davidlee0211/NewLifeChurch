"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Season } from "@/types/database";
import {
  Trophy,
  Loader2,
  Coins,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  talent: number;
  team_id: string | null;
}

export default function LeaderboardPage() {
  const { user, churchId } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [pastSeasons, setPastSeasons] = useState<Season[]>([]);
  const [expandedSeasonId, setExpandedSeasonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = user?.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!churchId) {
        setIsLoading(false);
        return;
      }

      // 전체 학생 목록 가져오기 (달란트 순)
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, name, talent, team_id")
        .eq("church_id", churchId)
        .order("talent", { ascending: false });

      if (studentsData) {
        setStudents(studentsData as Student[]);
      }

      // 종료된 시즌 목록 가져오기 (최신순)
      const { data: seasonsData } = await supabase
        .from("seasons")
        .select("*")
        .eq("church_id", churchId)
        .not("ended_at", "is", null)
        .order("season_number", { ascending: false });

      if (seasonsData) {
        setPastSeasons(seasonsData as Season[]);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [churchId]);

  const formatDate = (iso: string | null) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("ko-KR");
  };

  // 같은 달란트끼리 그룹핑 (공동 순위 시 다음 순위는 +1)
  const groups: { rank: number; talent: number; students: Student[] }[] = [];
  for (let i = 0; i < students.length; i++) {
    const existing = groups.find(g => g.talent === students[i].talent);
    if (existing) {
      existing.students.push(students[i]);
    } else {
      groups.push({ rank: groups.length + 1, talent: students[i].talent, students: [students[i]] });
    }
  }

  // 최대 달란트 (프로그레스바 계산용)
  const maxTalent = Math.max(...students.map((s) => s.talent), 1);

  // 내 순위 찾기
  const myGroup = groups.find(g => g.students.some(s => s.id === currentUserId));
  const myRank = myGroup?.rank || 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-google-yellow" /> 리더보드
        </h2>
        <Card className="border-2 border-gray-200">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
              <p className="text-gray-500 font-bold">로딩 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-google-yellow" /> 리더보드
      </h2>

      {/* 내 순위 표시 */}
      {myRank > 0 && (
        <Card className="bg-gradient-to-br from-google-yellow to-yellow-400 rounded-2xl shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-800 font-bold text-sm">내 순위</p>
                <p className="text-4xl font-black text-gray-800 mt-1">{myRank}위</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-800 font-bold text-sm">내 달란트</p>
                <p className="text-2xl font-black text-gray-800 mt-1 flex items-center justify-end gap-1">
                  {students.find(s => s.id === currentUserId)?.talent || 0}
                  <Coins className="w-6 h-6" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 전체 순위 */}
      <Card className="rounded-2xl shadow-md">
        <CardContent className="py-4">
          {students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">등록된 학생이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => {
                const hasMe = group.students.some(s => s.id === currentUserId);

                return (
                  <div
                    key={group.rank}
                    className={`flex items-center p-3 rounded-xl transition-all ${
                      hasMe
                        ? "bg-google-yellow/20 border-2 border-google-yellow"
                        : "bg-gray-50 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 w-full">
                      {/* 순위 */}
                      <span className="text-base sm:text-xl w-6 sm:w-8 text-center flex-shrink-0">
                        {group.rank === 1 ? "🥇" : group.rank === 2 ? "🥈" : group.rank === 3 ? "🥉" : <span className="text-gray-400 text-xs sm:text-sm font-bold">{group.rank}</span>}
                      </span>

                      <div className="flex-1 min-w-0">
                        {/* 이름 나란히 */}
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          {group.students.map((student) => (
                            <span key={student.id} className="text-xs sm:text-sm font-bold text-gray-800">
                              {student.name}
                              {student.id === currentUserId && (
                                <span className="ml-1 text-xs bg-google-yellow px-1.5 py-0.5 rounded font-bold">
                                  나
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                        {/* 달란트 바 */}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 sm:h-3 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 bg-google-yellow"
                              style={{
                                width: `${(group.talent / maxTalent) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs sm:text-sm font-black text-gray-700 w-10 sm:w-14 text-right flex items-center justify-end gap-0.5 sm:gap-1">
                            {group.talent}
                            <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-google-yellow" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 지난 시즌 랭킹 */}
      {pastSeasons.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600" /> 지난 시즌 랭킹
          </h3>
          {pastSeasons.map((season) => {
            const isOpen = expandedSeasonId === season.id;
            const archive = season.archived_data;
            const myRecord = archive?.students.find((s) => s.id === currentUserId);
            const sortedStudents = archive
              ? [...archive.students].sort((a, b) => b.talent - a.talent)
              : [];
            const myArchivedRank = myRecord
              ? sortedStudents.findIndex((s) => s.id === currentUserId) + 1
              : 0;

            return (
              <Card key={season.id} className="rounded-2xl shadow-md">
                <button
                  onClick={() => setExpandedSeasonId(isOpen ? null : season.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <p className="font-bold text-gray-800 text-sm">{season.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(season.started_at)} ~ {formatDate(season.ended_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {myRecord && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">내 결과</p>
                        <p className="text-xs font-bold text-gray-800">
                          {myArchivedRank}위 · {myRecord.talent}
                          <Coins className="inline w-3 h-3 ml-0.5 text-google-yellow" />
                        </p>
                      </div>
                    )}
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isOpen && archive && (
                  <CardContent className="border-t border-gray-100 pt-4">
                    {/* 팀 순위 */}
                    {archive.teams.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-gray-600 mb-2">팀 순위</p>
                        <div className="space-y-1">
                          {[...archive.teams]
                            .sort((a, b) => b.total_talent - a.total_talent)
                            .map((team, i) => (
                              <div
                                key={team.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
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

                    {/* 학생 순위 전체 */}
                    <div>
                      <p className="text-xs font-bold text-gray-600 mb-2">학생 순위</p>
                      <div className="space-y-1">
                        {sortedStudents.map((student, i) => {
                          const isMe = student.id === currentUserId;
                          return (
                            <div
                              key={student.id}
                              className={`flex items-center justify-between p-2 rounded-lg ${
                                isMe
                                  ? "bg-google-yellow/20 border border-google-yellow"
                                  : "bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold w-5 flex-shrink-0">
                                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                                </span>
                                <span className="text-sm font-bold text-gray-800 truncate">
                                  {student.name}
                                  {isMe && (
                                    <span className="ml-1 text-xs bg-google-yellow px-1.5 py-0.5 rounded font-bold">
                                      나
                                    </span>
                                  )}
                                </span>
                                {student.team_name && (
                                  <span className="text-xs text-gray-500 truncate">
                                    {student.team_name}
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-google-yellow flex items-center gap-0.5 text-sm flex-shrink-0">
                                {student.talent}
                                <Coins className="w-3 h-3" />
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
