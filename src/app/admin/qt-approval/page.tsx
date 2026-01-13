"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Student } from "@/types/database";
import { Camera, Clock, FileText, CheckCircle, Loader2, Hand } from "lucide-react";

interface QTSubmission {
  id: string;
  student_id: string;
  photo_url: string | null;
  date: string;
  created_at: string;
  student: Student;
}

export default function QTApprovalPage() {
  const { churchId, user } = useAuth();
  const [submissions, setSubmissions] = useState<QTSubmission[]>([]);
  const [selectedQT, setSelectedQT] = useState<QTSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [talentAmount, setTalentAmount] = useState(1);

  // 승인 대기 QT 목록 로드
  useEffect(() => {
    const fetchData = async () => {
      if (!churchId) return;

      setIsLoading(true);

      // 달란트 설정 가져오기
      const { data: settingData } = await supabase
        .from("talent_settings")
        .select("amount")
        .eq("church_id", churchId)
        .eq("quest_type", "qt")
        .single();

      if (settingData) {
        setTalentAmount((settingData as { amount: number }).amount);
      }

      // 승인 대기 중인 QT 기록 가져오기
      const { data: recordsData } = await supabase
        .from("quest_records")
        .select("id, student_id, photo_url, date, created_at")
        .eq("church_id", churchId)
        .eq("type", "qt")
        .eq("approved", false)
        .order("created_at", { ascending: false });

      if (!recordsData || recordsData.length === 0) {
        setSubmissions([]);
        setIsLoading(false);
        return;
      }

      // 학생 정보 가져오기
      const studentIds = Array.from(new Set((recordsData as { student_id: string }[]).map((r) => r.student_id)));
      const { data: studentsData } = await supabase
        .from("students")
        .select("*")
        .in("id", studentIds);

      const studentsMap = new Map(
        (studentsData || []).map((s) => [(s as Student).id, s as Student])
      );

      // 데이터 합치기
      const submissionsWithStudents: QTSubmission[] = (recordsData as QTSubmission[])
        .map((record) => ({
          ...record,
          student: studentsMap.get(record.student_id) as Student,
        }))
        .filter((s) => s.student);

      setSubmissions(submissionsWithStudents);
      setIsLoading(false);
    };

    fetchData();
  }, [churchId]);

  // 승인
  const handleApprove = async (submission: QTSubmission) => {
    if (!churchId || !user) return;

    setIsProcessing(true);

    try {
      // 1. quest_records 승인 처리
      const { error: updateError } = await supabase
        .from("quest_records")
        .update({
          approved: true,
          approved_by: user.id,
          talent_earned: talentAmount,
        } as never)
        .eq("id", submission.id);

      if (updateError) {
        alert("승인 처리 중 오류가 발생했습니다.");
        setIsProcessing(false);
        return;
      }

      // 2. 학생 달란트 지급
      const { error: talentError } = await supabase
        .from("students")
        .update({
          talent: submission.student.talent + talentAmount,
        } as never)
        .eq("id", submission.student_id);

      if (talentError) {
        alert("달란트 지급 중 오류가 발생했습니다.");
        setIsProcessing(false);
        return;
      }

      // 목록에서 제거
      setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
      setSelectedQT(null);
      alert(`QT가 승인되었습니다. ${submission.student.name}에게 +${talentAmount} 달란트가 지급되었습니다.`);
    } catch (error) {
      console.error("Error:", error);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 반려
  const handleReject = async (submission: QTSubmission) => {
    if (!confirm("정말 이 QT를 반려하시겠습니까?")) return;

    setIsProcessing(true);

    try {
      // quest_records 삭제
      const { error } = await supabase
        .from("quest_records")
        .delete()
        .eq("id", submission.id);

      if (error) {
        alert("반려 처리 중 오류가 발생했습니다.");
        setIsProcessing(false);
        return;
      }

      // 목록에서 제거
      setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
      setSelectedQT(null);
      alert("QT가 반려되었습니다.");
    } catch (error) {
      console.error("Error:", error);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Camera className="w-6 h-6 text-google-red" />
          QT 승인
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
        <Camera className="w-6 h-6 text-google-red" />
        QT 승인
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-google-yellow" />
              승인 대기 목록 ({submissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-google-green/10 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-google-green" />
                </div>
                <p className="text-gray-500 font-bold">승인 대기 중인 QT가 없습니다.</p>
              </div>
            ) : (
              <ul className="space-y-3 max-h-[500px] overflow-y-auto">
                {submissions.map((qt) => (
                  <li
                    key={qt.id}
                    className={`p-4 rounded-2xl cursor-pointer transition-all ${
                      selectedQT?.id === qt.id
                        ? "bg-google-blue/10 shadow-sm ring-2 ring-google-blue"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedQT(qt)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {qt.photo_url && (
                          <img
                            src={qt.photo_url}
                            alt="QT 사진"
                            className="w-12 h-12 object-cover rounded-xl"
                          />
                        )}
                        <div>
                          <p className="font-bold text-gray-800">{qt.student.name}</p>
                          <p className="text-sm text-gray-500">{qt.date}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(qt.created_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-google-blue" />
              QT 상세
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedQT ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-sm text-gray-500 mb-1">제출자</p>
                  <p className="font-bold text-lg">{selectedQT.student.name}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-sm text-gray-500 mb-1">제출일</p>
                  <p className="font-bold">{selectedQT.date}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-sm text-gray-500 mb-1">제출 시간</p>
                  <p className="font-bold">{formatDate(selectedQT.created_at)}</p>
                </div>

                {selectedQT.photo_url && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">QT 사진</p>
                    <img
                      src={selectedQT.photo_url}
                      alt="QT 사진"
                      className="w-full rounded-2xl shadow-sm"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => handleApprove(selectedQT)}
                    disabled={isProcessing}
                    className="flex-1 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    {isProcessing ? "처리 중..." : `승인 (+${talentAmount} 달란트)`}
                  </Button>
                  <Button
                    variant="red"
                    onClick={() => handleReject(selectedQT)}
                    disabled={isProcessing}
                    className="flex-1 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    반려
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Hand className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-bold">왼쪽 목록에서 QT를 선택하세요.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
