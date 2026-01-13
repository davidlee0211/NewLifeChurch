"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Student, Team } from "@/types/database";
import { Coins, Users, HandCoins, History, Loader2, Hand } from "lucide-react";

interface StudentWithTeam extends Student {
  team: Team | null;
}

interface TalentHistory {
  id: string;
  student_id: string;
  type: "attendance" | "recitation" | "qt" | "manual";
  talent_earned: number;
  date: string;
  created_at: string;
  student: Student;
}

// 로컬 시간 기준 날짜 (YYYY-MM-DD)
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function TalentPage() {
  const { churchId, user } = useAuth();
  const [students, setStudents] = useState<StudentWithTeam[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithTeam | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentHistory, setRecentHistory] = useState<TalentHistory[]>([]);

  // 학생 목록 로드
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

      if (studentsData) {
        setStudents(studentsData as StudentWithTeam[]);
      }

      // 최근 거래 내역 가져오기 (quest_records에서)
      const { data: historyData } = await supabase
        .from("quest_records")
        .select("id, student_id, type, talent_earned, date, created_at")
        .eq("church_id", churchId)
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (historyData && historyData.length > 0) {
        // 학생 정보 가져오기
        const studentIds = Array.from(new Set((historyData as { student_id: string }[]).map((h) => h.student_id)));
        const { data: historyStudents } = await supabase
          .from("students")
          .select("*")
          .in("id", studentIds);

        const studentsMap = new Map(
          (historyStudents || []).map((s) => [(s as Student).id, s as Student])
        );

        const historyWithStudents: TalentHistory[] = (historyData as TalentHistory[])
          .map((h) => ({
            ...h,
            student: studentsMap.get(h.student_id) as Student,
          }))
          .filter((h) => h.student);

        setRecentHistory(historyWithStudents);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [churchId]);

  // 달란트 지급
  const handleGiveTalent = async () => {
    if (!selectedStudent || !amount || !reason || !churchId || !user) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    const talentAmount = parseInt(amount);
    if (isNaN(talentAmount) || talentAmount <= 0) {
      alert("올바른 달란트 수량을 입력해주세요.");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. 학생 달란트 업데이트
      const newTalent = selectedStudent.talent + talentAmount;
      const { error: updateError } = await supabase
        .from("students")
        .update({ talent: newTalent } as never)
        .eq("id", selectedStudent.id);

      if (updateError) {
        alert("달란트 지급 중 오류가 발생했습니다.");
        setIsProcessing(false);
        return;
      }

      // 2. 기록 추가 (manual 타입으로)
      const today = getLocalDateString();
      await supabase
        .from("quest_records")
        .insert([{
          student_id: selectedStudent.id,
          church_id: churchId,
          type: "manual",
          date: today,
          talent_earned: talentAmount,
          approved: true,
          approved_by: user.id,
        }] as never);

      // 상태 업데이트
      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudent.id ? { ...s, talent: newTalent } : s
        )
      );
      setSelectedStudent({ ...selectedStudent, talent: newTalent });

      alert(`${selectedStudent.name}에게 ${talentAmount} 달란트가 지급되었습니다.`);
      setAmount("");
      setReason("");
    } catch (error) {
      console.error("Error:", error);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 달란트 차감
  const handleTakeTalent = async () => {
    if (!selectedStudent || !amount || !reason || !churchId || !user) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    const talentAmount = parseInt(amount);
    if (isNaN(talentAmount) || talentAmount <= 0) {
      alert("올바른 달란트 수량을 입력해주세요.");
      return;
    }

    if (selectedStudent.talent < talentAmount) {
      alert("현재 잔액보다 많은 금액은 차감할 수 없습니다.");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. 학생 달란트 업데이트
      const newTalent = selectedStudent.talent - talentAmount;
      const { error: updateError } = await supabase
        .from("students")
        .update({ talent: newTalent } as never)
        .eq("id", selectedStudent.id);

      if (updateError) {
        alert("달란트 차감 중 오류가 발생했습니다.");
        setIsProcessing(false);
        return;
      }

      // 2. 기록 추가 (음수 값으로)
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("quest_records")
        .insert([{
          student_id: selectedStudent.id,
          church_id: churchId,
          type: "manual",
          date: today,
          talent_earned: -talentAmount,
          approved: true,
          approved_by: user.id,
        }] as never);

      // 상태 업데이트
      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudent.id ? { ...s, talent: newTalent } : s
        )
      );
      setSelectedStudent({ ...selectedStudent, talent: newTalent });

      alert(`${selectedStudent.name}의 ${talentAmount} 달란트가 차감되었습니다.`);
      setAmount("");
      setReason("");
    } catch (error) {
      console.error("Error:", error);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ko-KR");
  };

  // 타입별 라벨
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "attendance":
        return "출석";
      case "recitation":
        return "암송";
      case "qt":
        return "QT";
      case "manual":
        return "수동";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Coins className="w-6 h-6 text-google-yellow" />
          달란트 관리
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
        <Coins className="w-6 h-6 text-google-yellow" />
        달란트 관리
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-google-blue" />
              학생 선택
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 학생이 없습니다.
              </div>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <li
                    key={student.id}
                    className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                      selectedStudent?.id === student.id
                        ? "bg-google-yellow/10 shadow-sm ring-2 ring-google-yellow"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div>
                      <p className="font-bold text-gray-800">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.team?.name || "팀 없음"}</p>
                    </div>
                    <span className="font-bold text-google-yellow flex items-center gap-1">
                      {student.talent}
                      <Coins className="w-4 h-4" />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-google-yellow" />
              달란트 지급/차감
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStudent ? (
              <div className="space-y-4">
                <div className="p-4 bg-google-yellow/10 rounded-2xl">
                  <p className="text-sm text-gray-500">선택된 학생</p>
                  <p className="text-xl font-bold text-gray-800">{selectedStudent.name}</p>
                  <p className="text-google-yellow font-bold flex items-center gap-1">
                    현재 잔액: {selectedStudent.talent}
                    <Coins className="w-4 h-4" />
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    달란트 수량
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="숫자 입력"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    사유
                  </label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="지급/차감 사유를 입력하세요"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleGiveTalent}
                    disabled={isProcessing}
                    variant="green"
                    className="flex-1 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      "지급"
                    )}
                  </Button>
                  <Button
                    variant="red"
                    onClick={handleTakeTalent}
                    disabled={isProcessing}
                    className="flex-1 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    차감
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Hand className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-bold">왼쪽 목록에서 학생을 선택하세요.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            최근 달란트 거래 내역
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              거래 내역이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-bold text-gray-600">학생</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-600">유형</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-600">금액</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-600">날짜</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHistory.map((history) => (
                    <tr key={history.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium">{history.student.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          history.type === "attendance" ? "bg-google-green/10 text-google-green" :
                          history.type === "qt" ? "bg-google-red/10 text-google-red" :
                          history.type === "recitation" ? "bg-google-yellow/10 text-google-yellow" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {getTypeLabel(history.type)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${
                          history.talent_earned >= 0 ? "text-google-green" : "text-google-red"
                        }`}>
                          {history.talent_earned >= 0 ? "+" : ""}{history.talent_earned}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{formatDate(history.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
