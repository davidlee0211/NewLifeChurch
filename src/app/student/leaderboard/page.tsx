"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  Trophy,
  Loader2,
  Coins,
  Medal
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  talent: number;
  team_id: string | null;
}

interface Team {
  id: string;
  name: string;
  color: string;
}

export default function LeaderboardPage() {
  const { user, churchId } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
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

      // 팀 목록 가져오기
      const { data: teamsData } = await supabase
        .from("teams")
        .select("id, name, color")
        .eq("church_id", churchId);

      if (teamsData) {
        setTeams(teamsData as Team[]);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [churchId]);

  // 팀 이름 가져오기
  const getTeamName = (teamId: string | null) => {
    if (!teamId) return null;
    const team = teams.find(t => t.id === teamId);
    return team?.name || null;
  };

  // 팀 색상 가져오기
  const getTeamColor = (teamId: string | null) => {
    if (!teamId) return null;
    const team = teams.find(t => t.id === teamId);
    return team?.color || null;
  };

  // 내 순위 찾기
  const myRank = students.findIndex(s => s.id === currentUserId) + 1;

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
              {students.map((student, index) => {
                const isMe = student.id === currentUserId;
                const teamName = getTeamName(student.team_id);
                const teamColor = getTeamColor(student.team_id);

                return (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      isMe
                        ? "bg-google-yellow/20 border-2 border-google-yellow"
                        : "bg-gray-50 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* 순위 */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                        index === 0 ? "bg-yellow-400 text-yellow-800" :
                        index === 1 ? "bg-gray-300 text-gray-700" :
                        index === 2 ? "bg-amber-400 text-amber-800" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {index < 3 ? (
                          <Medal className="w-5 h-5" />
                        ) : (
                          index + 1
                        )}
                      </div>

                      {/* 이름 및 팀 */}
                      <div className="flex items-center gap-2">
                        <p className="font-black text-gray-800">
                          {student.name}
                          {isMe && (
                            <span className="ml-1 text-xs bg-google-yellow px-1.5 py-0.5 rounded font-bold">
                              나
                            </span>
                          )}
                        </p>
                        {teamName && (
                          <span
                            className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: teamColor || "#666" }}
                          >
                            {teamName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 달란트 */}
                    <div className="flex items-center gap-1 font-black text-gray-700">
                      {student.talent}
                      <Coins className="w-4 h-4 text-google-yellow" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
