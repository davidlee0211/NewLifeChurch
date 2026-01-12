"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Student, Team } from "@/types/database";

interface StudentWithTeam extends Student {
  team: Team | null;
}

export default function StudentsPage() {
  const { churchId } = useAuth();
  const [students, setStudents] = useState<StudentWithTeam[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentTeam, setNewStudentTeam] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // 학생 목록 불러오기
  const fetchStudents = async () => {
    if (!churchId) return;

    const { data } = await supabase
      .from("students")
      .select("*, team:teams(*)")
      .eq("church_id", churchId)
      .order("login_code", { ascending: true });

    if (data) {
      setStudents(data as StudentWithTeam[]);
    }
    setIsLoading(false);
  };

  // 팀 목록 불러오기
  const fetchTeams = async () => {
    if (!churchId) return;

    const { data } = await supabase
      .from("teams")
      .select("*")
      .eq("church_id", churchId);

    if (data) {
      setTeams(data as Team[]);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchTeams();
  }, [churchId]);

  // 다음 학생 코드 생성 (001, 002, ...)
  const getNextStudentCode = (): string => {
    if (students.length === 0) return "001";

    const codes = students
      .map((s) => parseInt(s.login_code, 10))
      .filter((n) => !isNaN(n));

    const maxCode = Math.max(...codes, 0);
    const nextCode = maxCode + 1;

    if (nextCode > 999) {
      throw new Error("학생 코드 한도(999)를 초과했습니다.");
    }

    return String(nextCode).padStart(3, "0");
  };

  // 학생 추가
  const handleAddStudent = async () => {
    if (!churchId || !newStudentName.trim()) return;

    setIsAdding(true);
    try {
      const nextCode = getNextStudentCode();

      const { error } = await supabase.from("students").insert([{
        church_id: churchId,
        name: newStudentName.trim(),
        login_code: nextCode,
        team_id: newStudentTeam || null,
        talent: 0,
      }] as never);

      if (error) {
        alert("학생 추가 중 오류가 발생했습니다.");
        return;
      }

      await fetchStudents();
      setShowAddModal(false);
      setNewStudentName("");
      setNewStudentTeam("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsAdding(false);
    }
  };

  // 학생 삭제
  const handleDeleteStudent = async (student: StudentWithTeam) => {
    if (!confirm(`"${student.name}" 학생을 삭제하시겠습니까?`)) return;

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", student.id);

    if (error) {
      alert("삭제 중 오류가 발생했습니다.");
      return;
    }

    await fetchStudents();
  };

  const filteredStudents = students.filter((student) =>
    student.name.includes(searchTerm) || student.login_code.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">학생 관리</h2>
        <Button onClick={() => setShowAddModal(true)}>학생 추가</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <Input
              placeholder="이름 또는 코드로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">불러오는 중...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 학생이 없습니다. 학생을 추가해주세요.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">코드</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">이름</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">팀</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">달란트</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-google-blue">{student.login_code}</span>
                    </td>
                    <td className="py-3 px-4 font-medium">{student.name}</td>
                    <td className="py-3 px-4">
                      {student.team ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-google-blue rounded-full">
                          {student.team.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-google-blue">{student.talent}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" className="text-google-red" onClick={() => handleDeleteStudent(student)}>
                        삭제
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* 학생 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">학생 추가</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  학생 이름
                </label>
                <Input
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="예: 홍길동"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  팀 (선택)
                </label>
                <select
                  value={newStudentTeam}
                  onChange={(e) => setNewStudentTeam(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-google-blue focus:outline-none"
                >
                  <option value="">팀 없음</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  학생 코드: <span className="font-mono font-bold text-google-blue">{getNextStudentCode()}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  학생은 교회코드 + 이 코드로 로그인합니다.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowAddModal(false);
                  setNewStudentName("");
                  setNewStudentTeam("");
                }}
              >
                취소
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddStudent}
                disabled={!newStudentName.trim() || isAdding}
              >
                {isAdding ? "추가 중..." : "추가"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
