"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  Settings,
  Coins,
  Users,
  Database,
  Church,
  Pencil,
  Loader2,
  Save,
  Download,
  Trash2,
  Check,
  AlertTriangle,
} from "lucide-react";

interface TalentSettings {
  attendance: number;
  recitation: number;
  qt: number;
}

interface Team {
  id: string;
  name: string;
  color: string;
}

export default function SettingsPage() {
  const { churchId, church } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // 달란트 설정
  const [talentSettings, setTalentSettings] = useState<TalentSettings>({
    attendance: 10,
    recitation: 20,
    qt: 15,
  });
  const [isSavingTalent, setIsSavingTalent] = useState(false);
  const [talentSaved, setTalentSaved] = useState(false);

  // 팀 목록
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamColor, setEditTeamColor] = useState("");
  const [isSavingTeam, setIsSavingTeam] = useState(false);

  // 새 팀 추가
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#4285F4");
  const [isAddingTeam, setIsAddingTeam] = useState(false);

  // 교회 이름 수정
  const [churchName, setChurchName] = useState("");
  const [isSavingChurch, setIsSavingChurch] = useState(false);
  const [churchSaved, setChurchSaved] = useState(false);

  // 데이터 관리
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      if (!churchId) {
        setIsLoading(false);
        return;
      }

      // 달란트 설정 가져오기
      const { data: talentData } = await supabase
        .from("talent_settings")
        .select("*")
        .eq("church_id", churchId);

      if (talentData) {
        const settings: TalentSettings = {
          attendance: 10,
          recitation: 20,
          qt: 15,
        };
        talentData.forEach((item: { quest_type: string; amount: number }) => {
          if (item.quest_type === "attendance") settings.attendance = item.amount;
          if (item.quest_type === "recitation") settings.recitation = item.amount;
          if (item.quest_type === "qt") settings.qt = item.amount;
        });
        setTalentSettings(settings);
      }

      // 팀 목록 가져오기
      const { data: teamsData } = await supabase
        .from("teams")
        .select("id, name, color")
        .eq("church_id", churchId)
        .order("name");

      if (teamsData) {
        setTeams(teamsData as Team[]);
      }

      // 교회 이름 설정
      if (church) {
        setChurchName(church.name);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [churchId, church]);

  // 달란트 설정 저장
  const handleSaveTalentSettings = async () => {
    if (!churchId) return;

    setIsSavingTalent(true);
    try {
      // 각 타입별로 upsert
      const types = ["attendance", "recitation", "qt"] as const;

      for (const type of types) {
        // 기존 레코드 확인
        const { data: existing } = await supabase
          .from("talent_settings")
          .select("id")
          .eq("church_id", churchId)
          .eq("quest_type", type)
          .single();

        const existingRecord = existing as { id: string } | null;

        if (existingRecord) {
          // 업데이트
          await supabase
            .from("talent_settings")
            .update({ amount: talentSettings[type] } as never)
            .eq("id", existingRecord.id);
        } else {
          // 새로 생성
          await supabase.from("talent_settings").insert([
            {
              church_id: churchId,
              quest_type: type,
              amount: talentSettings[type],
            },
          ] as never);
        }
      }

      setTalentSaved(true);
      setTimeout(() => setTalentSaved(false), 2000);
    } catch (error) {
      console.error("달란트 설정 저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingTalent(false);
    }
  };

  // 팀 수정 시작
  const handleEditTeam = (team: Team) => {
    setEditingTeam(team.id);
    setEditTeamName(team.name);
    setEditTeamColor(team.color);
  };

  // 팀 수정 저장
  const handleSaveTeam = async () => {
    if (!editingTeam || !editTeamName.trim()) return;

    setIsSavingTeam(true);
    try {
      await supabase
        .from("teams")
        .update({ name: editTeamName.trim(), color: editTeamColor } as never)
        .eq("id", editingTeam);

      setTeams(
        teams.map((t) =>
          t.id === editingTeam
            ? { ...t, name: editTeamName.trim(), color: editTeamColor }
            : t
        )
      );
      setEditingTeam(null);
    } catch (error) {
      console.error("팀 수정 실패:", error);
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setIsSavingTeam(false);
    }
  };

  // 팀 삭제
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("이 팀을 삭제하시겠습니까? 배정된 학생들의 팀이 해제됩니다.")) return;

    try {
      // 학생들의 team_id를 null로 업데이트
      await supabase
        .from("students")
        .update({ team_id: null } as never)
        .eq("team_id", teamId);

      // 팀 삭제
      await supabase.from("teams").delete().eq("id", teamId);

      setTeams(teams.filter((t) => t.id !== teamId));
    } catch (error) {
      console.error("팀 삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 새 팀 추가
  const handleAddTeam = async () => {
    if (!churchId || !newTeamName.trim()) return;

    setIsAddingTeam(true);
    try {
      const { data, error } = await supabase
        .from("teams")
        .insert([
          {
            church_id: churchId,
            name: newTeamName.trim(),
            color: newTeamColor,
          },
        ] as never)
        .select()
        .single();

      if (error) throw error;

      setTeams([...teams, data as Team]);
      setShowAddTeam(false);
      setNewTeamName("");
      setNewTeamColor("#4285F4");
    } catch (error) {
      console.error("팀 추가 실패:", error);
      alert("추가 중 오류가 발생했습니다.");
    } finally {
      setIsAddingTeam(false);
    }
  };

  // 교회 이름 저장
  const handleSaveChurchName = async () => {
    if (!churchId || !churchName.trim()) return;

    setIsSavingChurch(true);
    try {
      await supabase
        .from("churches")
        .update({ name: churchName.trim() } as never)
        .eq("id", churchId);

      setChurchSaved(true);
      setTimeout(() => setChurchSaved(false), 2000);
    } catch (error) {
      console.error("교회 이름 저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingChurch(false);
    }
  };

  // CSV 내보내기 - 달란트 기록
  const handleExportTalent = async () => {
    if (!churchId) return;

    setIsExporting(true);
    try {
      const { data: students } = await supabase
        .from("students")
        .select("id, name, talent, team_id")
        .eq("church_id", churchId)
        .order("name");

      if (!students || students.length === 0) {
        alert("내보낼 데이터가 없습니다.");
        return;
      }

      // CSV 생성
      const headers = ["이름", "달란트", "팀"];
      const rows = students.map((s: { name: string; talent: number; team_id: string | null }) => {
        const team = teams.find((t) => t.id === s.team_id);
        return [s.name, s.talent.toString(), team?.name || "미배정"];
      });

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `달란트_기록_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("내보내기 실패:", error);
      alert("내보내기 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  // CSV 내보내기 - 출석 기록
  const handleExportAttendance = async () => {
    if (!churchId) return;

    setIsExporting(true);
    try {
      const { data: records } = await supabase
        .from("attendance_records")
        .select("*, students(name)")
        .eq("church_id", churchId)
        .order("date", { ascending: false });

      if (!records || records.length === 0) {
        alert("내보낼 출석 기록이 없습니다.");
        return;
      }

      // CSV 생성
      const headers = ["날짜", "학생 이름", "출석", "암송"];
      const rows = records.map((r: { date: string; attendance: boolean; recitation: boolean; students: { name: string } }) => [
        r.date,
        r.students?.name || "알 수 없음",
        r.attendance ? "O" : "X",
        r.recitation ? "O" : "X",
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `출석_기록_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("내보내기 실패:", error);
      alert("내보내기 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  // 데이터 초기화
  const handleResetData = async () => {
    if (!churchId) return;

    const confirmMsg = "정말로 이번 학기 데이터를 초기화하시겠습니까?\n\n- 모든 학생의 달란트가 0으로 초기화됩니다.\n- 출석/암송 기록이 삭제됩니다.\n- QT 제출 기록이 삭제됩니다.\n\n이 작업은 되돌릴 수 없습니다.";

    if (!confirm(confirmMsg)) return;

    const doubleConfirm = prompt("정말 초기화하시려면 '초기화'를 입력하세요.");
    if (doubleConfirm !== "초기화") {
      alert("초기화가 취소되었습니다.");
      return;
    }

    setIsResetting(true);
    try {
      // 학생 달란트 초기화
      await supabase
        .from("students")
        .update({ talent: 0 } as never)
        .eq("church_id", churchId);

      // 출석 기록 삭제
      await supabase
        .from("attendance_records")
        .delete()
        .eq("church_id", churchId);

      // QT 제출 기록 삭제
      await supabase
        .from("qt_submissions")
        .delete()
        .eq("church_id", churchId);

      alert("데이터가 초기화되었습니다.");
    } catch (error) {
      console.error("초기화 실패:", error);
      alert("초기화 중 오류가 발생했습니다.");
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Settings className="w-6 h-6 text-gray-600" />
          설정
        </h2>
        <Card className="rounded-2xl">
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto text-google-blue animate-spin mb-4" />
              <p className="text-gray-500 font-bold">불러오는 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
        <Settings className="w-6 h-6 text-gray-600" />
        설정
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 달란트 설정 */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-google-yellow" />
              달란트 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  출석 달란트
                </label>
                <Input
                  type="number"
                  value={talentSettings.attendance}
                  onChange={(e) =>
                    setTalentSettings({
                      ...talentSettings,
                      attendance: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">출석 체크 시 지급되는 달란트</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  암송 달란트
                </label>
                <Input
                  type="number"
                  value={talentSettings.recitation}
                  onChange={(e) =>
                    setTalentSettings({
                      ...talentSettings,
                      recitation: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">암송 체크 시 지급되는 달란트</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  QT 승인 달란트
                </label>
                <Input
                  type="number"
                  value={talentSettings.qt}
                  onChange={(e) =>
                    setTalentSettings({
                      ...talentSettings,
                      qt: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">QT 승인 시 지급되는 달란트</p>
              </div>

              <Button
                className="rounded-xl shadow-md hover:shadow-lg transition-all w-full"
                onClick={handleSaveTalentSettings}
                disabled={isSavingTalent}
              >
                {isSavingTalent ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    저장 중...
                  </span>
                ) : talentSaved ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    저장됨!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    설정 저장
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 팀 관리 */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-google-blue" />
              팀 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p className="mb-2">등록된 팀이 없습니다.</p>
                <p className="text-sm">팀 뽑기에서 팀을 생성하거나 아래에서 추가하세요.</p>
              </div>
            ) : (
              <ul className="space-y-3 mb-4">
                {teams.map((team) => (
                  <li
                    key={team.id}
                    className="flex items-center justify-between p-3 rounded-2xl"
                    style={{ backgroundColor: `${team.color}15` }}
                  >
                    {editingTeam === team.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="color"
                          value={editTeamColor}
                          onChange={(e) => setEditTeamColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <Input
                          value={editTeamName}
                          onChange={(e) => setEditTeamName(e.target.value)}
                          className="flex-1"
                          placeholder="팀 이름"
                        />
                        <Button
                          size="sm"
                          className="rounded-xl"
                          onClick={handleSaveTeam}
                          disabled={isSavingTeam}
                        >
                          {isSavingTeam ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => setEditingTeam(null)}
                        >
                          취소
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="font-bold">{team.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => handleEditTeam(team)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-google-red hover:bg-google-red/10"
                            onClick={() => handleDeleteTeam(team.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {showAddTeam ? (
              <div className="space-y-3 p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newTeamColor}
                    onChange={(e) => setNewTeamColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="새 팀 이름"
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      setShowAddTeam(false);
                      setNewTeamName("");
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    className="flex-1 rounded-xl"
                    onClick={handleAddTeam}
                    disabled={isAddingTeam || !newTeamName.trim()}
                  >
                    {isAddingTeam ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "추가"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="secondary"
                className="w-full rounded-xl"
                onClick={() => setShowAddTeam(true)}
              >
                새 팀 추가
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 데이터 관리 */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-google-green" />
              데이터 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                variant="secondary"
                className="w-full rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                onClick={handleExportTalent}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                달란트 기록 내보내기 (CSV)
              </Button>
              <Button
                variant="secondary"
                className="w-full rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                onClick={handleExportAttendance}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                출석 기록 내보내기 (CSV)
              </Button>
              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="red"
                  className="w-full rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  onClick={handleResetData}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  이번 학기 데이터 초기화
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  달란트, 출석, QT 기록이 모두 삭제됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 계정 설정 */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Church className="w-5 h-5 text-purple-600" />
              교회 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  교회 이름
                </label>
                <Input
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  placeholder="교회 이름을 입력하세요"
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">교회 코드</p>
                <p className="font-mono font-bold text-google-blue">
                  {church?.code || "-"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  로그인 시 사용하는 코드입니다. (변경 불가)
                </p>
              </div>

              <Button
                className="rounded-xl shadow-md hover:shadow-lg transition-all w-full"
                onClick={handleSaveChurchName}
                disabled={isSavingChurch || !churchName.trim()}
              >
                {isSavingChurch ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    저장 중...
                  </span>
                ) : churchSaved ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    저장됨!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    교회 정보 수정
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
