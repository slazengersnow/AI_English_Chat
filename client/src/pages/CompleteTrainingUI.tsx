import React, { useState, useRef, useEffect } from "react";
import ChatStyleTraining from "../ChatStyleTraining";

type DifficultyLevel =
  | "toeic"
  | "middle_school"
  | "high_school"
  | "basic_verbs"
  | "business_email"
  | "simulation";

const difficultyLevels = {
  toeic: { name: "TOEIC", color: "bg-blue-500", textColor: "text-white" },
  middle_school: { name: "中学英語", color: "bg-green-500", textColor: "text-white" },
  high_school: { name: "高校英語", color: "bg-purple-500", textColor: "text-white" },
  basic_verbs: { name: "基本動詞", color: "bg-orange-500", textColor: "text-white" },
  business_email: { name: "ビジネスメール", color: "bg-red-500", textColor: "text-white" },
  simulation: { name: "シミュレーション練習", color: "bg-indigo-500", textColor: "text-white" },
};

export default function CompleteTrainingUI() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [showMyPage, setShowMyPage] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const handleDifficultySelect = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty);
  };

  const handleBackToMenu = () => {
    setSelectedDifficulty(null);
    setShowMyPage(false);
    setShowAdmin(false);
  };

  const handleGoToMyPage = () => {
    setShowMyPage(true);
    setSelectedDifficulty(null);
  };

  const handleGoToAdmin = () => {
    setShowAdmin(true);
    setSelectedDifficulty(null);
  };

  // If a specific difficulty is selected, show the training interface
  if (selectedDifficulty) {
    return (
      <ChatStyleTraining
        difficulty={selectedDifficulty}
        onBackToMenu={handleBackToMenu}
        onGoToMyPage={handleGoToMyPage}
      />
    );
  }

  // Main difficulty selection page
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#e7effe" }}>
      {/* Header with Admin and MyPage buttons positioned at the absolute right edge */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={handleGoToAdmin}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          管理
        </button>
        <button
          onClick={handleGoToMyPage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          マイページ
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        {/* App Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            AI瞬間英作文チャット
          </h1>
          <p className="text-lg text-gray-600">
            AIが瞬時に添削・評価します
          </p>
        </div>

        {/* Difficulty Selection Grid */}
        <div className="grid grid-cols-2 gap-6 max-w-4xl w-full">
          {Object.entries(difficultyLevels).map(([key, level]) => (
            <button
              key={key}
              onClick={() => handleDifficultySelect(key as DifficultyLevel)}
              className={`${level.color} ${level.textColor} p-8 rounded-2xl text-xl font-bold hover:opacity-90 transition-opacity shadow-lg`}
            >
              {level.name}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>レベルを選択して英作文練習を始めましょう</p>
        </div>
      </div>
    </div>
  );
}