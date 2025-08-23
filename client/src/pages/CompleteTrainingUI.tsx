import React, { useState, useRef, useEffect } from "react";
import ChatStyleTraining from "../ChatStyleTraining";
import { useLocation } from "wouter";

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
  const [, setLocation] = useLocation();

  const handleDifficultySelect = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty);
  };

  const handleBackToMenu = () => {
    setSelectedDifficulty(null);
    setShowMyPage(false);
    setShowAdmin(false);
  };

  const handleGoToMyPage = () => {
    console.log("🔗 Navigating to /my-page");
    setLocation("/my-page");
  };

  const handleGoToAdmin = () => {
    console.log("🔗 Navigating to /admin");
    setLocation("/admin");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header with Admin and MyPage buttons positioned at the absolute right edge */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={handleGoToAdmin}
          className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm border border-gray-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z"/>
          </svg>
          管理者
        </button>
        <button
          onClick={handleGoToMyPage}
          className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm border border-gray-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/>
          </svg>
          マイページ
        </button>
      </div>

      {/* Header */}
      <div className="max-w-md mx-auto pt-8 pb-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">英作文トレーニング</h1>
          <p className="text-gray-600 text-sm">AIが瞬時に添削・評価します</p>
        </div>
      </div>

      {/* Difficulty Selection List */}
      <div className="max-w-md mx-auto space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 px-2">レベルを選択してください</h2>
        
        {/* TOEIC */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
             onClick={() => handleDifficultySelect('toeic')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">TOEIC</h3>
                <p className="text-sm text-gray-500">ビジネス英語・資格対策</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </div>
        </div>

        {/* 中学英語 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
             onClick={() => handleDifficultySelect('middle_school')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">中学英語</h3>
                <p className="text-sm text-gray-500">基本的な文法と語彙</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </div>
        </div>

        {/* 高校英語 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
             onClick={() => handleDifficultySelect('high_school')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">高校英語</h3>
                <p className="text-sm text-gray-500">応用文法と表現</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </div>
        </div>

        {/* 基本動詞 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
             onClick={() => handleDifficultySelect('basic_verbs')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">基本動詞</h3>
                <p className="text-sm text-gray-500">日常動詞の使い分け</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </div>
        </div>

        {/* ビジネスメール */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
             onClick={() => handleDifficultySelect('business_email')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">ビジネスメール</h3>
                <p className="text-sm text-gray-500">実務メール作成</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </div>
        </div>

        {/* シミュレーション練習 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
             onClick={() => handleDifficultySelect('simulation')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">シミュレーション練習</h3>
                <p className="text-sm text-gray-500">実際の場面を想定した練習</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </div>
        </div>

        {/* Premium Features */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white mt-6">
          <h3 className="font-semibold mb-2">プレミアム機能</h3>
          <div className="text-sm opacity-90 space-y-1">
            <p>・詳細な添削フィードバック</p>
            <p>・進捗レポート機能</p>
            <p>・無制限の練習問題</p>
          </div>
          <button className="mt-3 bg-white bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-30 transition-all">
            7日間無料でお試し
          </button>
        </div>
      </div>
    </div>
  );
}