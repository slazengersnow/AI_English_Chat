"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DifficultySelection = DifficultySelection;
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const wouter_1 = require("wouter");
const constants_1 = require("@/lib/constants");
const useSubscription_1 = require("@/hooks/useSubscription");
const iconMap = {
    'book-open': lucide_react_1.BookOpen,
    'graduation-cap': lucide_react_1.GraduationCap,
    'briefcase': lucide_react_1.Briefcase,
    'zap': lucide_react_1.Zap,
    'mail': lucide_react_1.Mail,
};
const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
};
function DifficultySelection({ onDifficultySelect }) {
    const { canAccessPremiumFeatures } = (0, useSubscription_1.useSubscription)();
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto pt-8 pb-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI瞬間英作文チャット</h1>
          <p className="text-gray-600 text-sm">AIが瞬時に添削・評価します</p>
        </div>
      </div>

      {/* Difficulty Selection Cards */}
      <div className="max-w-md mx-auto space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 px-2">レベルを選択してください</h2>
        
        {Object.entries(constants_1.DIFFICULTY_LEVELS).map(([key, level], index) => {
            const Icon = iconMap[level.icon];
            const colorClass = colorMap[level.color];
            return (<div key={key}>
              <card_1.Card className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]" onClick={() => onDifficultySelect(key)}>
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${colorClass} rounded-full flex items-center justify-center`}>
                    <Icon className="w-6 h-6"/>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{level.name}</h3>
                    <p className="text-sm text-gray-600">{level.description}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </card_1.Card>
              
              {/* Insert Simulation Option after business-email */}
              {key === 'business-email' && (canAccessPremiumFeatures ? (<wouter_1.Link href="/simulation">
                    <card_1.Card className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02] mt-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                          <lucide_react_1.Users className="w-6 h-6"/>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">シミュレーション練習</h3>
                          <p className="text-sm text-gray-600">実際の場面を想定した練習</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </card_1.Card>
                  </wouter_1.Link>) : (<card_1.Card className="bg-gray-50 rounded-2xl p-4 shadow-sm border border-gray-200 mt-3 relative">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center">
                        <lucide_react_1.Users className="w-6 h-6"/>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-500">シミュレーション練習</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          この機能はプレミアム会員向けです。この機能により特定のシチュエーションを想定した瞬間英作文を練習することができます。
                        </p>
                      </div>
                      <lucide_react_1.Lock className="w-5 h-5 text-gray-400"/>
                    </div>
                  </card_1.Card>))}
            </div>);
        })}
      </div>



      {/* Premium Features - Show for both standard and trial users */}
      <div className="max-w-md mx-auto mt-8 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
        <div className="text-center">
          <h3 className="font-semibold mb-3">最短で英語力アップ</h3>
          <div className="text-sm opacity-90 mb-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span>•</span>
              <span>ネイティブ水準の添削フィードバック</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>•</span>
              <span>あなた専用の進捗レポートで実力が見える</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>•</span>
              <span>中学生英語レベル〜TOEIC対策まで対応</span>
            </div>
          </div>
          <wouter_1.Link href="/subscription-select">
            <button className="bg-white text-blue-600 px-6 py-2 rounded-full font-medium text-sm hover:bg-gray-100 transition-colors">
              今すぐ本登録する
            </button>
          </wouter_1.Link>
        </div>
      </div>
    </div>);
}
