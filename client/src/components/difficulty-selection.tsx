import { Card } from "@/components/ui/card";
import { BookOpen, GraduationCap, Briefcase, Zap, Mail, Users } from "lucide-react";
import { Link } from "wouter";
import { DIFFICULTY_LEVELS, type DifficultyKey } from "@/lib/constants";

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
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

      {/* Difficulty Selection Cards */}
      <div className="max-w-md mx-auto space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 px-2">レベルを選択してください</h2>
        
        {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => {
          const Icon = iconMap[level.icon as keyof typeof iconMap];
          const colorClass = colorMap[level.color as keyof typeof colorMap];
          
          return (
            <Card 
              key={key}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
              onClick={() => onDifficultySelect(key as DifficultyKey)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 ${colorClass} rounded-full flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{level.name}</h3>
                  <p className="text-sm text-gray-600">{level.description}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </Card>
          );
        })}

        {/* Simulation Option */}
        <Link href="/simulation">
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-sm border-0 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02] text-white">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">シミュレーション練習</h3>
                <p className="text-sm text-white text-opacity-90">実際の場面を想定した練習</p>
              </div>
              <svg className="w-5 h-5 text-white text-opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </Card>
        </Link>
      </div>

      {/* Premium Features */}
      <div className="max-w-md mx-auto mt-8 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
        <div className="text-center">
          <h3 className="font-semibold mb-2">プレミアム機能</h3>
          <p className="text-sm opacity-90 mb-3">
            • 詳細な添削フィードバック<br/>
            • 進捗レポート機能<br/>
            • 無制限の練習問題
          </p>
          <button className="bg-white text-purple-600 px-6 py-2 rounded-full font-medium text-sm hover:bg-gray-100 transition-colors">
            7日間無料で試す
          </button>
        </div>
      </div>
    </div>
  );
}