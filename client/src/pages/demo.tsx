import React from "react";
import { useLocation } from "wouter";
import { DifficultySelection } from "@/components/difficulty-selection";
import { type DifficultyKey } from "@/lib/constants";

export default function Demo() {
  const [, setLocation] = useLocation();

  const handleBackToLogin = () => {
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-[#e7effe]">
      {/* Header with demo info */}
      <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-800 text-sm font-medium">🎯 デモモード</span>
            <span className="text-yellow-600 text-xs">認証不要で体験中</span>
          </div>
          <button
            onClick={handleBackToLogin}
            className="text-blue-600 hover:text-blue-800 text-xs underline"
          >
            ログイン画面へ
          </button>
        </div>
      </div>

      {/* Main training interface */}
      <div className="max-w-md mx-auto p-4">
        <DifficultySelection 
          onDifficultySelect={(difficulty: DifficultyKey) => {
            console.log(`Demo mode: ${difficulty} level selected`);
            // For demo, just show a message or redirect to a demo version
          }} 
        />
      </div>
    </div>
  );
}