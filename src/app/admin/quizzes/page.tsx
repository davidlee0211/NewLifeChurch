"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import QuizManagementSection from "@/components/admin/QuizManagementSection";
import { Dices, Hand, HelpCircle } from "lucide-react";

type Tab = "bible-dice" | "rps";

export default function QuizzesPage() {
  const { churchId } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("bible-dice");

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
        <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-google-blue" />
        퀴즈 관리
      </h2>

      {/* 탭 */}
      <div className="flex gap-2 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab("bible-dice")}
          className={`px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-4 -mb-0.5 transition-all ${
            activeTab === "bible-dice"
              ? "border-google-blue text-google-blue"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Dices className="w-4 h-4" />
          바이블다이스
        </button>
        <button
          onClick={() => setActiveTab("rps")}
          className={`px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-4 -mb-0.5 transition-all ${
            activeTab === "rps"
              ? "border-google-red text-google-red"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Hand className="w-4 h-4" />
          가위바위보
        </button>
      </div>

      {activeTab === "bible-dice" && (
        <QuizManagementSection
          churchId={churchId}
          tableName="bible_dice_quizzes"
          accentClassName="border-google-blue"
          emptyStateMessage="새 퀴즈를 추가해서 바이블다이스 게임을 시작하세요!"
        />
      )}

      {activeTab === "rps" && (
        <QuizManagementSection
          churchId={churchId}
          tableName="rps_quizzes"
          accentClassName="border-google-red"
          emptyStateMessage="새 퀴즈를 추가해서 가위바위보 퀴즈 게임을 시작하세요!"
        />
      )}
    </div>
  );
}
