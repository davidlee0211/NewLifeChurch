"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface Team {
  id: string;
  name: string;
  color: string;
}

interface TeamMember {
  id: string;
  name: string;
  talent: number;
}

interface TeamWithTalent {
  id: string;
  name: string;
  color: string;
  totalTalent: number;
}

// 프로필 아이콘 목록
const profileIcons = ["😊", "😎", "🤗", "😄", "🥳", "🤩", "😇", "🤓", "😋", "🙂"];

// 이름 기반 일관된 아이콘 선택
const getProfileIcon = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return profileIcons[Math.abs(hash) % profileIcons.length];
};

export default function MyTeamPage() {
  const { user, churchId } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allTeams, setAllTeams] = useState<TeamWithTalent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const teamId = (user as { team_id?: string })?.team_id;
  const currentUserId = user?.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!churchId) {
        setIsLoading(false);
        return;
      }

      // 내 팀 정보 가져오기
      if (teamId) {
        const { data: teamData } = await supabase
          .from("teams")
          .select("*")
          .eq("id", teamId)
          .single();

        if (teamData) {
          setTeam(teamData as Team);
        }

        // 팀원 목록 가져오기
        const { data: membersData } = await supabase
          .from("students")
          .select("id, name, talent")
          .eq("team_id", teamId)
          .order("talent", { ascending: false });

        if (membersData) {
          setTeamMembers(membersData as TeamMember[]);
        }
      }

      // 전체 팀 목록 및 달란트 합계 가져오기
      const { data: teamsData } = await supabase
        .from("teams")
        .select("id, name, color")
        .eq("church_id", churchId);

      if (teamsData) {
        // 각 팀의 총 달란트 계산
        const teamsWithTalent: TeamWithTalent[] = [];

        for (const t of teamsData as Team[]) {
          const { data: studentsData } = await supabase
            .from("students")
            .select("talent")
            .eq("team_id", t.id);

          const totalTalent = studentsData?.reduce((sum, s) => sum + ((s as { talent: number }).talent || 0), 0) || 0;

          teamsWithTalent.push({
            ...(t as Team),
            totalTalent,
          });
        }

        // 달란트 순으로 정렬
        teamsWithTalent.sort((a, b) => b.totalTalent - a.totalTalent);
        setAllTeams(teamsWithTalent);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [churchId, teamId]);

  // 팀 총 달란트
  const teamTotalTalent = teamMembers.reduce((sum, m) => sum + m.talent, 0);

  // 내 팀 순위
  const myTeamRank = allTeams.findIndex((t) => t.id === teamId) + 1;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <span>👥</span> 내 팀
        </h2>
        <Card className="border-2 border-gray-200">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <span className="text-3xl">⏳</span>
              </div>
              <p className="text-gray-500 font-bold">로딩 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 팀 미배정 상태
  if (!teamId || !team) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <span>👥</span> 내 팀
        </h2>

        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-white rounded-2xl flex items-center justify-center mb-4 border-4 border-gray-200 shadow-lg">
                <span className="text-5xl">🎲</span>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">
                아직 팀이 없어요!
              </h3>
              <p className="text-gray-500">
                곧 팀이 정해질 거예요
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 전체 팀 순위 (미배정이어도 볼 수 있음) */}
        {allTeams.length > 0 && (
          <div>
            <h3 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2">
              <span>🏆</span> 전체 팀 순위
            </h3>
            <Card className="border-2 border-gray-200">
              <CardContent className="py-4">
                <div className="space-y-2">
                  {allTeams.map((t, index) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border-2 border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-white border-b-4"
                          style={{
                            backgroundColor: t.color || "#4285F4",
                            borderColor: `${t.color || "#4285F4"}dd`,
                          }}
                        >
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                        </div>
                        <span className="font-bold text-gray-800">{t.name}</span>
                      </div>
                      <span className="font-black text-gray-700">
                        {t.totalTalent} 🪙
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // 팀 배정 상태
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
        <span>👥</span> 내 팀
      </h2>

      {/* 팀 정보 카드 */}
      <Card
        className="border-b-4 text-white"
        style={{
          backgroundColor: team.color || "#4285F4",
          borderColor: `${team.color || "#4285F4"}dd`,
        }}
      >
        <CardContent className="py-6">
          <div className="text-center mb-4">
            <h3 className="text-3xl font-black">{team.name}</h3>
            {myTeamRank > 0 && (
              <p className="text-white/80 font-bold mt-1">
                현재 {myTeamRank}위
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-xl p-4 text-center">
              <p className="text-white/80 text-sm font-bold">팀 총 달란트</p>
              <p className="text-3xl font-black mt-1">{teamTotalTalent} 🪙</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4 text-center">
              <p className="text-white/80 text-sm font-bold">팀원 수</p>
              <p className="text-3xl font-black mt-1">{teamMembers.length}명</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 팀원 목록 */}
      <div>
        <h3 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2">
          <span>👨‍👩‍👧‍👦</span> 우리 팀원
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {teamMembers.map((member, index) => {
            const isMe = member.id === currentUserId;
            return (
              <Card
                key={member.id}
                className={`border-2 ${isMe ? "border-google-yellow bg-yellow-50" : "border-gray-200"}`}
              >
                <CardContent className="py-4">
                  <div className="text-center">
                    {/* 프로필 아이콘 */}
                    <div
                      className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-2 border-b-4"
                      style={{
                        backgroundColor: team.color || "#4285F4",
                        borderColor: `${team.color || "#4285F4"}dd`,
                      }}
                    >
                      <span className="text-2xl">{getProfileIcon(member.name)}</span>
                    </div>

                    {/* 이름 */}
                    <p className="font-black text-gray-800">
                      {member.name}
                      {isMe && (
                        <span className="ml-1 text-xs bg-google-yellow px-1.5 py-0.5 rounded font-bold">
                          나
                        </span>
                      )}
                    </p>

                    {/* 달란트 */}
                    <p className="text-sm text-gray-500 font-bold mt-1">
                      {member.talent} 🪙
                    </p>

                    {/* 순위 뱃지 */}
                    {index < 3 && (
                      <div className="mt-2">
                        <span className="text-lg">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 전체 팀 순위 */}
      {allTeams.length > 0 && (
        <div>
          <h3 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2">
            <span>🏆</span> 전체 팀 순위
          </h3>
          <Card className="border-2 border-gray-200">
            <CardContent className="py-4">
              <div className="space-y-2">
                {allTeams.map((t, index) => {
                  const isMyTeam = t.id === teamId;
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 ${
                        isMyTeam
                          ? "bg-blue-50 border-google-blue"
                          : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-white border-b-4"
                          style={{
                            backgroundColor: t.color || "#4285F4",
                            borderColor: `${t.color || "#4285F4"}dd`,
                          }}
                        >
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{t.name}</span>
                          {isMyTeam && (
                            <span className="text-xs bg-google-blue text-white px-1.5 py-0.5 rounded font-bold">
                              내 팀
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-black text-gray-700">
                        {t.totalTalent} 🪙
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
