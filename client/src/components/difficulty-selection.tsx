import { Card } from "@/components/ui/card";
import { BookOpen, GraduationCap, Briefcase, Zap, Mail, Users, Crown, Lock } from "lucide-react";
import { Link } from "wouter";
import { DIFFICULTY_LEVELS, type DifficultyKey } from "@/lib/constants";
import { useSubscription } from "@/hooks/useSubscription";

interface DifficultySelectionProps {
  onDifficultySelect: (difficulty: DifficultyKey) => void;
}

const iconMap = {
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  'briefcase': Briefcase,
  'zap': Zap,
  'mail': Mail,
};

const colorMap = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
};

export function DifficultySelection({ onDifficultySelect }: DifficultySelectionProps) {
  const { canAccessPremiumFeatures } = useSubscription();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto pt-12 pb-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            AI瞬間英作文チャット
          </h1>
          <p className="text-gray-600 text-base">AIが瞬時に添削・評価します</p>
        </div>
      </div>

      {/* Difficulty Selection Cards */}
      <div className="max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 px-2 text-center">レベルを選択してください</h2>
        
        {Object.entries(DIFFICULTY_LEVELS).map(([key, level], index) => {
          const Icon = iconMap[level.icon as keyof typeof iconMap];
          const colorClass = colorMap[level.color as keyof typeof colorMap];
          
          return (
            <div key={key}>
              <Card 
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg shadow-gray-200/50 border border-white/60 hover:shadow-xl hover:shadow-gray-300/30 transition-all duration-300 cursor-pointer transform hover:scale-[1.03] hover:-translate-y-1 group"
                onClick={() => onDifficultySelect(key as DifficultyKey)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 ${colorClass} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-700 transition-colors">{level.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </Card>
              
              {/* Insert Simulation Option after business-email */}
              {key === 'business-email' && (
                canAccessPremiumFeatures ? (
                  <Link href="/simulation">
                    <Card className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02] mt-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">シミュレーション練習</h3>
                          <p className="text-sm text-gray-600">実際の場面を想定した練習</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </Card>
                  </Link>
                ) : (
                  <Card className="bg-gray-50 rounded-2xl p-4 shadow-sm border border-gray-200 mt-3 relative">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-500">シミュレーション練習</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          この機能はプレミアム会員向けです。この機能により特定のシチュエーションを想定した瞬間英作文を練習することができます。
                        </p>
                      </div>
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card>
                )
              )}
            </div>
          );
        })}
      </div>



      {/* Premium Features - Enhanced Design */}
      <div className="max-w-md mx-auto mt-12 p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl text-white shadow-2xl shadow-purple-500/25 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-3xl"></div>
        <div className="relative">
          <div className="text-center">
            <div className="w-12 h-12 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-300" />
            </div>
            <h3 className="font-bold text-xl mb-4">最短で英語力アップ</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <div className="w-2 h-2 bg-yellow-300 rounded-full flex-shrink-0"></div>
                <span>ネイティブ水準の添削フィードバック</span>
              </div>
              <div className="flex items-center gap-3 text-sm bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-300 rounded-full flex-shrink-0"></div>
                <span>あなた専用の進捗レポートで実力が見える</span>
              </div>
              <div className="flex items-center gap-3 text-sm bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <div className="w-2 h-2 bg-blue-300 rounded-full flex-shrink-0"></div>
                <span>中学生英語レベル〜TOEIC対策まで対応</span>
              </div>
            </div>
            <Link href="/subscription-select">
              <button className="bg-white text-purple-700 px-8 py-3 rounded-2xl font-bold text-base hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg">
                今すぐ本登録する
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Bottom spacing */}
      <div className="h-8"></div>
    </div>
  );
}