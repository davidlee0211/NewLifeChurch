"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import {
  Church,
  Users,
  UserCog,
  Trash2,
  Loader2,
  Calendar,
  TrendingUp,
  Eye
} from "lucide-react";

interface ChurchData {
  id: string;
  name: string;
  code: string;
  created_at: string;
  studentCount: number;
  adminCount: number;
}

export default function SuperAdminDashboard() {
  const [churches, setChurches] = useState<ChurchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChurch, setSelectedChurch] = useState<ChurchData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 통계
  const [stats, setStats] = useState({
    totalChurches: 0,
    totalStudents: 0,
    totalAdmins: 0,
  });

  const fetchData = async () => {
    setIsLoading(true);

    // 교회 목록 가져오기
    const { data: churchesData } = await supabase
      .from("churches")
      .select("*")
      .order("created_at", { ascending: false });

    if (churchesData) {
      // 각 교회별 학생 수, 관리자 수 가져오기
      const churchesWithCounts = await Promise.all(
        (churchesData as { id: string; name: string; code: string; created_at: string }[]).map(async (church) => {
          const { count: studentCount } = await supabase
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("church_id", church.id);

          const { count: adminCount } = await supabase
            .from("admins")
            .select("*", { count: "exact", head: true })
            .eq("church_id", church.id);

          return {
            ...church,
            studentCount: studentCount || 0,
            adminCount: adminCount || 0,
          } as ChurchData;
        })
      );

      setChurches(churchesWithCounts);

      // 통계 계산
      setStats({
        totalChurches: churchesWithCounts.length,
        totalStudents: churchesWithCounts.reduce((sum, c) => sum + c.studentCount, 0),
        totalAdmins: churchesWithCounts.reduce((sum, c) => sum + c.adminCount, 0),
      });
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 교회 삭제
  const handleDeleteChurch = async (church: ChurchData) => {
    if (!confirm(`"${church.name}" 교회를 삭제하시겠습니까?\n\n관련된 모든 데이터(학생, 관리자, 팀 등)가 삭제됩니다.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      // 관련 데이터 삭제 (순서 중요)
      await supabase.from("qt_submissions").delete().eq("church_id", church.id);
      await supabase.from("qt_topics").delete().eq("church_id", church.id);
      await supabase.from("attendance_records").delete().eq("church_id", church.id);
      await supabase.from("talent_settings").delete().eq("church_id", church.id);
      await supabase.from("students").delete().eq("church_id", church.id);
      await supabase.from("teams").delete().eq("church_id", church.id);
      await supabase.from("admins").delete().eq("church_id", church.id);
      await supabase.from("churches").delete().eq("id", church.id);

      await fetchData();
      setSelectedChurch(null);
      alert("교회가 삭제되었습니다.");
    } catch (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-purple-600" />
          슈퍼 관리자 대시보드
        </h2>
        <Card className="rounded-2xl">
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto text-purple-600 animate-spin mb-4" />
              <p className="text-gray-500 font-bold">데이터를 불러오는 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
        <TrendingUp className="w-7 h-7 text-purple-600" />
        슈퍼 관리자 대시보드
      </h2>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Church className="w-7 h-7" />
              </div>
              <div>
                <p className="text-white/80 font-bold">등록된 교회</p>
                <p className="text-3xl font-black">{stats.totalChurches}개</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <p className="text-white/80 font-bold">전체 학생 수</p>
                <p className="text-3xl font-black">{stats.totalStudents}명</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <UserCog className="w-7 h-7" />
              </div>
              <div>
                <p className="text-white/80 font-bold">전체 관리자 수</p>
                <p className="text-3xl font-black">{stats.totalAdmins}명</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 교회 목록 */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Church className="w-5 h-5 text-purple-600" />
            등록된 교회 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {churches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 교회가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-bold text-gray-600">교회 이름</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-600">코드</th>
                    <th className="text-center py-3 px-4 font-bold text-gray-600">학생 수</th>
                    <th className="text-center py-3 px-4 font-bold text-gray-600">관리자 수</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-600">등록일</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-600">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {churches.map((church) => (
                    <tr key={church.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-bold text-gray-800">{church.name}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                          {church.code}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-gray-700">{church.studentCount}명</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-gray-700">{church.adminCount}명</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-500 text-sm flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(church.created_at)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 hover:bg-purple-100 rounded-xl"
                            onClick={() => setSelectedChurch(church)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-google-red hover:bg-google-red/10 rounded-xl"
                            onClick={() => handleDeleteChurch(church)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 교회 상세 모달 */}
      {selectedChurch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
              <Church className="w-5 h-5 text-purple-600" />
              교회 상세 정보
            </h3>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">교회 이름</p>
                <p className="font-bold text-lg text-gray-800">{selectedChurch.name}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">교회 코드</p>
                <p className="font-mono font-bold text-lg text-purple-600">{selectedChurch.code}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-blue-600 font-bold">학생 수</p>
                  <p className="text-2xl font-black text-blue-700">{selectedChurch.studentCount}명</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-green-600 font-bold">관리자 수</p>
                  <p className="text-2xl font-black text-green-700">{selectedChurch.adminCount}명</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">등록일</p>
                <p className="font-bold text-gray-800">{formatDate(selectedChurch.created_at)}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1 rounded-xl"
                onClick={() => setSelectedChurch(null)}
              >
                닫기
              </Button>
              <Button
                variant="red"
                className="flex-1 rounded-xl"
                onClick={() => {
                  handleDeleteChurch(selectedChurch);
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    삭제 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    교회 삭제
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
