"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface TodayRecord {
  id: string;
  approved: boolean;
  talent_earned: number;
  photo_url: string | null;
}

export default function QTUploadPage() {
  const { user, churchId } = useAuth();
  const [todayRecord, setTodayRecord] = useState<TodayRecord | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [talentAmount, setTalentAmount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split("T")[0];

  // 오늘 QT 기록 확인 및 달란트 설정 로드
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !churchId) return;

      // 오늘 QT 기록 확인
      const { data: recordData } = await supabase
        .from("quest_records")
        .select("id, approved, talent_earned, photo_url")
        .eq("student_id", user.id)
        .eq("type", "qt")
        .eq("date", today)
        .single();

      if (recordData) {
        setTodayRecord(recordData as TodayRecord);
      }

      // 달란트 설정 로드
      const { data: settingData } = await supabase
        .from("talent_settings")
        .select("amount")
        .eq("church_id", churchId)
        .eq("quest_type", "qt")
        .single();

      if (settingData) {
        setTalentAmount((settingData as { amount: number }).amount);
      }
    };

    fetchData();
  }, [user?.id, churchId, today]);

  // 이미지 선택 핸들러
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // 카메라/갤러리 열기
  const openImagePicker = (capture?: "environment" | "user") => {
    if (fileInputRef.current) {
      if (capture) {
        fileInputRef.current.setAttribute("capture", capture);
      } else {
        fileInputRef.current.removeAttribute("capture");
      }
      fileInputRef.current.click();
    }
  };

  // 이미지 제거
  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 업로드 핸들러
  const handleUpload = async () => {
    if (!selectedImage || !user?.id || !churchId) return;

    setIsUploading(true);

    try {
      // 1. Supabase Storage에 이미지 업로드
      const timestamp = Date.now();
      const fileExt = selectedImage.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${today}_${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("qt-photos")
        .upload(filePath, selectedImage);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("이미지 업로드 중 오류가 발생했습니다.");
        setIsUploading(false);
        return;
      }

      // 2. 이미지 URL 가져오기
      const { data: urlData } = supabase.storage
        .from("qt-photos")
        .getPublicUrl(filePath);

      const photoUrl = urlData.publicUrl;

      // 3. quest_records 테이블에 레코드 생성
      const { error: recordError } = await supabase
        .from("quest_records")
        .insert([{
          student_id: user.id,
          church_id: churchId,
          type: "qt",
          date: today,
          photo_url: photoUrl,
          approved: false,
          talent_earned: 0,
        }] as never);

      if (recordError) {
        console.error("Record error:", recordError);
        alert("QT 기록 저장 중 오류가 발생했습니다.");
        setIsUploading(false);
        return;
      }

      // 성공
      setUploadSuccess(true);
      setTodayRecord({
        id: "",
        approved: false,
        talent_earned: 0,
        photo_url: photoUrl,
      });

      // 3초 후 성공 애니메이션 숨기기
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);

    } catch (error) {
      console.error("Error:", error);
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  // 이미 제출 완료 & 승인 완료
  if (todayRecord?.approved) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <span>📷</span> QT 인증
        </h2>

        <Card className="border-2 border-google-green bg-green-50">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-google-green rounded-full flex items-center justify-center mb-4 animate-bounce">
                <span className="text-5xl">🎉</span>
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-2">
                승인 완료!
              </h3>
              <p className="text-google-green font-black text-3xl mb-4">
                +{todayRecord.talent_earned} 달란트
              </p>
              <p className="text-gray-500 text-sm">
                오늘도 말씀 묵상 잘했어요!
              </p>
            </div>

            {todayRecord.photo_url && (
              <div className="mt-6">
                <img
                  src={todayRecord.photo_url}
                  alt="QT 인증 사진"
                  className="w-full max-w-xs mx-auto rounded-xl border-4 border-white shadow-lg"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 이미 제출 완료 & 승인 대기
  if (todayRecord && !todayRecord.approved) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <span>📷</span> QT 인증
        </h2>

        <Card className="border-2 border-google-blue bg-blue-50">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-google-blue rounded-full flex items-center justify-center mb-4">
                <span className="text-5xl animate-pulse">⏳</span>
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-2">
                제출 완료!
              </h3>
              <p className="text-google-blue font-bold text-lg mb-2">
                선생님 확인 중...
              </p>
              <p className="text-gray-500 text-sm">
                승인되면 +{talentAmount} 달란트를 받아요!
              </p>
            </div>

            {todayRecord.photo_url && (
              <div className="mt-6">
                <img
                  src={todayRecord.photo_url}
                  alt="QT 인증 사진"
                  className="w-full max-w-xs mx-auto rounded-xl border-4 border-white shadow-lg"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 업로드 성공 애니메이션
  if (uploadSuccess) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <span>📷</span> QT 인증
        </h2>

        <Card className="border-2 border-google-green bg-green-50">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="absolute inset-0 bg-google-green rounded-full animate-ping opacity-25" />
                <div className="relative w-32 h-32 bg-google-green rounded-full flex items-center justify-center">
                  <span className="text-6xl">✅</span>
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-2">
                업로드 성공!
              </h3>
              <p className="text-gray-500">
                선생님이 확인하면 달란트를 받아요!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 기본: 업로드 폼
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
        <span>📷</span> QT 인증
      </h2>
      <p className="text-gray-500 text-sm">오늘 QT한 사진을 찍어 올려주세요!</p>

      {/* 히든 파일 인풋 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* 미리보기 또는 업로드 영역 */}
      {previewUrl ? (
        <Card className="border-2 border-google-blue">
          <CardContent className="py-4">
            <div className="relative">
              <img
                src={previewUrl}
                alt="미리보기"
                className="w-full rounded-xl"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 w-10 h-10 bg-google-red text-white rounded-full flex items-center justify-center font-bold shadow-lg hover:scale-110 transition-transform"
              >
                ✕
              </button>
            </div>

            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full mt-4"
              size="lg"
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  업로드 중...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>📤</span>
                  QT 인증하기
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-4xl">📷</span>
              </div>
              <p className="text-gray-500 font-bold">
                QT 사진을 올려주세요
              </p>
              <p className="text-gray-400 text-sm mt-1">
                승인되면 +{talentAmount} 달란트!
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => openImagePicker("environment")}
                variant="primary"
                className="w-full"
                size="lg"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>📸</span>
                  카메라로 찍기
                </span>
              </Button>

              <Button
                onClick={() => openImagePicker()}
                variant="secondary"
                className="w-full"
                size="lg"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>🖼️</span>
                  갤러리에서 선택
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 안내 메시지 */}
      <Card className="bg-google-yellow/20 border-2 border-google-yellow">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-bold text-gray-800 text-sm">QT 인증 팁!</p>
              <ul className="text-gray-600 text-xs mt-1 space-y-1">
                <li>• QT 노트나 성경 사진을 찍어주세요</li>
                <li>• 글씨가 잘 보이게 찍으면 좋아요</li>
                <li>• 하루에 한 번만 인증할 수 있어요</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
