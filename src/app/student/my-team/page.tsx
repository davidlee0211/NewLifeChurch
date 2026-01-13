"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Loader2,
  Dices,
  UsersRound,
  Coins
} from "lucide-react";

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

export default function MyTeamPage() {
  const { user, churchId } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
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

      setIsLoading(false);
    };

    fetchData();
  }, [churchId, teamId]);

  // 팀 총 달란트
  const teamTotalTalent = teamMembers.reduce((sum, m) => sum + m.talent, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-google-blue" /> 내 팀
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

  // 팀 미배정 상태
  if (!teamId || !team) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-google-blue" /> 내 팀
        </h2>

        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-white rounded-2xl flex items-center justify-center mb-4 border-4 border-gray-200 shadow-lg">
                <Dices className="w-12 h-12 text-gray-400" />
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
      </div>
    );
  }

  // 팀 배정 상태
  return (
    <div className="space-y-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-xl p-4 text-center">
              <p className="text-white/80 text-sm font-bold">팀 총 달란트</p>
              <p className="text-3xl font-black mt-1 flex items-center justify-center gap-1">{teamTotalTalent} <Coins className="w-6 h-6" /></p>
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
          <UsersRound className="w-5 h-5 text-google-green" /> 우리 팀원
        </h3>
        <Card className="rounded-2xl">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((member) => {
                const isMe = member.id === currentUserId;
                return (
                  <span
                    key={member.id}
                    className={`px-3 py-1.5 rounded-full font-bold ${
                      isMe
                        ? "bg-google-yellow text-gray-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {member.name}
                    {isMe && " (나)"}
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
