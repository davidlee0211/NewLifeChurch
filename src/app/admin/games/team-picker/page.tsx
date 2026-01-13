"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Loader2,
  Settings,
  Play,
  RotateCcw,
  Save,
  Check,
  Pencil,
  Shuffle,
  ArrowLeft,
  Dices,
  Trophy
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  team_id: string | null;
}

interface TeamConfig {
  id: string;
  name: string;
  color: string;
}

interface TeamAssignment {
  [studentId: string]: string; // studentId -> teamId
}

type GamePhase = "setup" | "picking" | "results";

// 기본 팀 색상
const DEFAULT_COLORS = [
  "#4285F4", // Google Blue
  "#EA4335", // Google Red
  "#34A853", // Google Green
  "#FBBC04", // Google Yellow
  "#9C27B0", // Purple
  "#FF5722", // Deep Orange
  "#00BCD4", // Cyan
  "#795548", // Brown
];

export default function TeamPickerPage() {
  const { churchId } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gamePhase, setGamePhase] = useState<GamePhase>("setup");

  // 팀 설정
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState<TeamConfig[]>([]);

  // 뽑기 진행
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [assignments, setAssignments] = useState<TeamAssignment>({});

  // 결과 수정
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);

  const rouletteRef = useRef<HTMLDivElement>(null);

  // 학생 목록 가져오기
  useEffect(() => {
    const fetchStudents = async () => {
      if (!churchId) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("students")
        .select("id, name, team_id")
        .eq("church_id", churchId)
        .order("name");

      if (data) {
        setStudents(data as Student[]);
      }
      setIsLoading(false);
    };

    fetchStudents();
  }, [churchId]);

  // 팀 개수 변경 시 팀 설정 초기화
  useEffect(() => {
    const newTeams: TeamConfig[] = [];
    for (let i = 0; i < teamCount; i++) {
      newTeams.push({
        id: `team-${i}`,
        name: `${i + 1}팀`,
        color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      });
    }
    setTeams(newTeams);
  }, [teamCount]);

  // 팀 이름 변경
  const handleTeamNameChange = (index: number, name: string) => {
    const newTeams = [...teams];
    newTeams[index].name = name;
    setTeams(newTeams);
  };

  // 팀 색상 변경
  const handleTeamColorChange = (index: number, color: string) => {
    const newTeams = [...teams];
    newTeams[index].color = color;
    setTeams(newTeams);
  };

  // 게임 시작
  const startGame = () => {
    setUnassignedStudents([...students]);
    setAssignments({});
    setCurrentStudent(null);
    setGamePhase("picking");
  };

  // 학생 선택 (뽑기 시작)
  const selectStudent = (student: Student) => {
    if (isSpinning || currentStudent) return;
    setCurrentStudent(student);
  };

  // 가장 인원이 적은 팀들 찾기 (균등 배분)
  const getTeamsWithMinMembers = () => {
    const teamCounts = teams.map((team) => ({
      teamId: team.id,
      teamIndex: teams.findIndex((t) => t.id === team.id),
      count: Object.values(assignments).filter((id) => id === team.id).length,
    }));

    const minCount = Math.min(...teamCounts.map((t) => t.count));
    return teamCounts.filter((t) => t.count === minCount);
  };

  // 룰렛 돌리기
  const spinRoulette = () => {
    if (!currentStudent || isSpinning) return;

    setIsSpinning(true);

    // 균등 배분: 가장 인원이 적은 팀들 중에서 랜덤 선택
    const eligibleTeams = getTeamsWithMinMembers();
    const selectedTeam = eligibleTeams[Math.floor(Math.random() * eligibleTeams.length)];
    const finalTeamIndex = selectedTeam.teamIndex;

    // 각 팀이 차지하는 각도
    const sliceAngle = 360 / teams.length;

    // 팀 N의 중앙은 N * sliceAngle 각도에 있음 (12시 방향 = 0도 기준)
    // 화살표가 위쪽(0도)에 고정되어 있으므로, 해당 팀이 위쪽에 오려면
    // 룰렛을 -(N * sliceAngle)만큼 회전 = 360 - (N * sliceAngle)
    const sectorCenterAngle = finalTeamIndex * sliceAngle;

    // 5~8바퀴 회전 후 해당 팀이 위쪽에 오도록
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    // 현재 회전값을 360으로 정규화
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    // 목표 각도: 해당 팀이 위쪽에 오도록
    const targetAngle = (360 - sectorCenterAngle) % 360;
    // 현재 위치에서 목표까지 필요한 추가 회전
    let neededRotation = targetAngle - normalizedRotation;
    if (neededRotation <= 0) neededRotation += 360;

    const finalRotation = rotation + extraSpins + neededRotation;

    setRotation(finalRotation);

    // 애니메이션 완료 후 배정
    setTimeout(() => {
      const newAssignments = { ...assignments };
      newAssignments[currentStudent.id] = teams[finalTeamIndex].id;
      setAssignments(newAssignments);

      // 미배정 학생에서 제거
      setUnassignedStudents((prev) =>
        prev.filter((s) => s.id !== currentStudent.id)
      );

      setCurrentStudent(null);
      setIsSpinning(false);

      // 모든 학생 배정 완료 시 결과 화면으로
      if (unassignedStudents.length === 1) {
        setTimeout(() => setGamePhase("results"), 500);
      }
    }, 4000); // 4초 애니메이션
  };

  // 학생 팀 변경 (결과 수정)
  const handleChangeTeam = (studentId: string, teamId: string) => {
    const newAssignments = { ...assignments };
    newAssignments[studentId] = teamId;
    setAssignments(newAssignments);
    setEditingStudent(null);
  };

  // DB에 저장
  const saveToDatabase = async () => {
    if (!churchId) return;

    setIsSaving(true);

    try {
      // 팀 ID 매핑 (임시 ID -> 실제 DB ID)
      const teamIdMap: { [key: string]: string } = {};

      // teams 테이블에 팀 생성/업데이트
      for (const team of teams) {
        const { data: existingTeam } = await supabase
          .from("teams")
          .select("id")
          .eq("church_id", churchId)
          .eq("name", team.name)
          .single();

        if (existingTeam) {
          // 기존 팀 업데이트
          await supabase
            .from("teams")
            .update({ color: team.color } as never)
            .eq("id", (existingTeam as { id: string }).id);

          // 팀 ID 매핑
          teamIdMap[team.id] = (existingTeam as { id: string }).id;
        } else {
          // 새 팀 생성
          const { data: newTeam } = await supabase
            .from("teams")
            .insert([{
              church_id: churchId,
              name: team.name,
              color: team.color,
            }] as never)
            .select("id")
            .single();

          if (newTeam) {
            teamIdMap[team.id] = (newTeam as { id: string }).id;
          }
        }
      }

      // 학생들의 팀 배정 업데이트
      for (const [studentId, tempTeamId] of Object.entries(assignments)) {
        const actualTeamId = teamIdMap[tempTeamId] || tempTeamId;
        await supabase
          .from("students")
          .update({ team_id: actualTeamId } as never)
          .eq("id", studentId);
      }

      setSaveComplete(true);
    } catch (error) {
      alert("저장 중 오류가 발생했습니다.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // 팀별 배정된 학생 가져오기
  const getTeamStudents = (teamId: string) => {
    return students.filter((s) => assignments[s.id] === teamId);
  };

  // 초기화
  const resetGame = () => {
    setGamePhase("setup");
    setAssignments({});
    setCurrentStudent(null);
    setUnassignedStudents([]);
    setSaveComplete(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
          <Dices className="w-7 h-7 text-google-red" />
          팀 뽑기
        </h2>
        <Card className="rounded-2xl">
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto text-gray-400 animate-spin mb-4" />
              <p className="text-gray-500 font-bold">불러오는 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 설정 화면
  if (gamePhase === "setup") {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
          <Dices className="w-7 h-7 text-google-red" />
          팀 뽑기
        </h2>

        {students.length === 0 ? (
          <Card className="rounded-2xl border-2 border-dashed border-gray-300">
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">등록된 학생이 없습니다</h3>
                <p className="text-gray-500">학생 관리에서 먼저 학생을 등록해주세요.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 학생 목록 */}
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-google-blue" />
                  참가 학생 ({students.length}명)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {students.map((student) => (
                    <span
                      key={student.id}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-bold"
                    >
                      {student.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 팀 설정 */}
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-google-green" />
                  팀 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 팀 개수 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    팀 개수
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        onClick={() => setTeamCount(num)}
                        className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                          teamCount === num
                            ? "bg-google-blue text-white shadow-lg scale-110"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 팀 이름 및 색상 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    팀 이름 & 색상
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {teams.map((team, index) => (
                      <div
                        key={team.id}
                        className="flex items-center gap-3 p-3 rounded-xl border-2"
                        style={{ borderColor: team.color }}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black"
                          style={{ backgroundColor: team.color }}
                        >
                          {index + 1}
                        </div>
                        <Input
                          value={team.name}
                          onChange={(e) => handleTeamNameChange(index, e.target.value)}
                          className="flex-1"
                          placeholder={`${index + 1}팀`}
                        />
                        <div className="relative">
                          <input
                            type="color"
                            value={team.color}
                            onChange={(e) => handleTeamColorChange(index, e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 시작 버튼 */}
                <Button
                  onClick={startGame}
                  size="lg"
                  className="w-full rounded-2xl flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  팀 뽑기 시작!
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  // 뽑기 진행 화면
  if (gamePhase === "picking") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <Dices className="w-7 h-7 text-google-red" />
            팀 뽑기
          </h2>
          <Button variant="ghost" onClick={resetGame} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            설정으로
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 미배정 학생 목록 */}
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-google-blue" />
                미배정 학생 ({unassignedStudents.length}명)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {unassignedStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => selectStudent(student)}
                    disabled={isSpinning || currentStudent !== null}
                    className={`px-4 py-2 rounded-xl font-bold transition-all ${
                      currentStudent?.id === student.id
                        ? "bg-google-yellow text-gray-800 scale-105 shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {student.name}
                  </button>
                ))}
              </div>
              {unassignedStudents.length === 0 && (
                <p className="text-center text-gray-500 py-4">모든 학생이 배정되었습니다!</p>
              )}
            </CardContent>
          </Card>

          {/* 룰렛 */}
          <Card className="rounded-2xl shadow-md lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-google-red" />
                룰렛
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                {/* 현재 선택된 학생 */}
                <div className="mb-6 text-center">
                  {currentStudent ? (
                    <div className="bg-google-yellow/20 px-6 py-3 rounded-2xl border-2 border-google-yellow">
                      <p className="text-sm text-gray-600 font-bold">선택된 학생</p>
                      <p className="text-2xl font-black text-gray-800">{currentStudent.name}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-100 px-6 py-3 rounded-2xl border-2 border-dashed border-gray-300">
                      <p className="text-gray-500 font-bold">학생을 선택해주세요</p>
                    </div>
                  )}
                </div>

                {/* 원형 룰렛 */}
                <div className="relative mb-6">
                  {/* 화살표 (위쪽 고정) */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-gray-800" />
                  </div>

                  {/* 룰렛 판 */}
                  <div
                    ref={rouletteRef}
                    className="w-72 h-72 sm:w-80 sm:h-80 rounded-full relative overflow-hidden shadow-2xl border-4 border-gray-800"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: isSpinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                      background: (() => {
                        const sliceAngle = 360 / teams.length;
                        // 팀 이름 위치와 색상 위치를 맞추기 위해 시작점 조정
                        // 팀 이름은 0도(12시)에서 시작, 색상도 동일하게
                        const startOffset = -90 + sliceAngle / 2;
                        return `conic-gradient(from ${startOffset}deg, ${teams.map((team, index) => {
                          const startDeg = index * sliceAngle;
                          const endDeg = (index + 1) * sliceAngle;
                          return `${team.color} ${startDeg}deg ${endDeg}deg`;
                        }).join(", ")})`;
                      })(),
                    }}
                  >
                    {/* 팀 이름들 - 색상 섹터와 같은 위치에 배치 */}
                    {teams.map((team, index) => {
                      const sliceAngle = 360 / teams.length;
                      // 색상 섹터: startOffset에서 시작해서 index * sliceAngle ~ (index+1) * sliceAngle
                      // 섹터 중앙 = startOffset + index * sliceAngle + sliceAngle/2
                      // startOffset = -90 - sliceAngle/2 이므로
                      // 섹터 중앙 = -90 - sliceAngle/2 + index * sliceAngle + sliceAngle/2 = -90 + index * sliceAngle
                      // CSS rotate에서 0도는 12시 방향이 아니라 3시 방향이므로
                      // 12시 기준으로 팀 0 중앙은 0도, 팀 1 중앙은 sliceAngle도...
                      const labelAngle = index * sliceAngle;
                      return (
                        <div
                          key={team.id}
                          className="absolute left-1/2 top-0 origin-bottom h-1/2 flex items-start justify-center pt-6"
                          style={{
                            transform: `translateX(-50%) rotate(${labelAngle}deg)`,
                          }}
                        >
                          <span
                            className="text-white font-black text-sm sm:text-base whitespace-nowrap"
                            style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
                          >
                            {team.name}
                          </span>
                        </div>
                      );
                    })}

                    {/* 중앙 원 */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-gray-800">
                      <Dices className="w-8 h-8 text-gray-800" />
                    </div>
                  </div>
                </div>

                {/* 뽑기 버튼 */}
                <Button
                  onClick={spinRoulette}
                  disabled={!currentStudent || isSpinning}
                  size="lg"
                  variant="red"
                  className="rounded-2xl px-12 flex items-center gap-2"
                >
                  {isSpinning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      룰렛 돌리는 중...
                    </>
                  ) : (
                    <>
                      <Dices className="w-5 h-5" />
                      룰렛 돌리기!
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 배정 현황 */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-google-yellow" />
              배정 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {teams.map((team) => {
                const teamStudents = getTeamStudents(team.id);
                return (
                  <div
                    key={team.id}
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: `${team.color}20`, borderColor: team.color, borderWidth: 2 }}
                  >
                    <div
                      className="text-center mb-3 py-2 rounded-xl text-white font-black"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.name}
                    </div>
                    <div className="space-y-1">
                      {teamStudents.map((student) => (
                        <div
                          key={student.id}
                          className="bg-white px-2 py-1 rounded-lg text-sm font-bold text-gray-700 text-center"
                        >
                          {student.name}
                        </div>
                      ))}
                      {teamStudents.length === 0 && (
                        <p className="text-gray-400 text-sm text-center py-2">-</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 결과 화면
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
          <Trophy className="w-7 h-7 text-google-yellow" />
          팀 배정 결과
        </h2>
        <Button variant="ghost" onClick={resetGame} className="rounded-xl">
          <RotateCcw className="w-4 h-4 mr-2" />
          다시 뽑기
        </Button>
      </div>

      {/* 저장 완료 메시지 */}
      {saveComplete && (
        <Card className="rounded-2xl bg-google-green/10 border-2 border-google-green">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 text-google-green">
              <Check className="w-6 h-6" />
              <p className="font-bold">팀 배정이 저장되었습니다!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 팀별 결과 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const teamStudents = getTeamStudents(team.id);
          return (
            <Card
              key={team.id}
              className="rounded-2xl shadow-lg overflow-hidden"
            >
              <div
                className="py-4 px-6 text-white"
                style={{ backgroundColor: team.color }}
              >
                <h3 className="text-xl font-black">{team.name}</h3>
                <p className="text-white/80 font-bold">{teamStudents.length}명</p>
              </div>
              <CardContent className="py-4">
                <div className="space-y-2">
                  {teamStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <span className="font-bold text-gray-700">{student.name}</span>
                      {editingStudent === student.id ? (
                        <select
                          value={assignments[student.id]}
                          onChange={(e) => handleChangeTeam(student.id, e.target.value)}
                          className="px-3 py-1.5 text-sm border-2 border-google-blue rounded-lg focus:outline-none"
                        >
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingStudent(student.id)}
                          className="p-2 text-gray-400 hover:text-google-blue hover:bg-google-blue/10 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {teamStudents.length === 0 && (
                    <p className="text-gray-400 text-center py-4">배정된 학생이 없습니다</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 저장 버튼 */}
      {!saveComplete && (
        <Card className="rounded-2xl shadow-md">
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4 font-bold">
                팀 배정을 확정하고 저장하시겠습니까?
              </p>
              <Button
                onClick={saveToDatabase}
                disabled={isSaving}
                size="lg"
                variant="green"
                className="rounded-2xl px-12 flex items-center justify-center gap-2 mx-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    팀 배정 저장하기
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
