"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeSelection = ThemeSelection;
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const constants_1 = require("@/lib/constants");
const iconMap = {
    user: lucide_react_1.User,
    zap: lucide_react_1.Zap,
    lightbulb: lucide_react_1.Lightbulb,
    'trending-up': lucide_react_1.TrendingUp,
    heart: lucide_react_1.Heart,
};
const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
};
function ThemeSelection({ onThemeSelect }) {
    return (<div className="min-h-screen bg-gradient-to-br from-line-green/10 to-blue-50 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto pt-8 pb-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-line-green rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AIキャリア開発支援</h1>
          <p className="text-secondary-text text-sm">あなたのキャリアをサポートします</p>
        </div>
      </div>

      {/* Theme Selection Cards */}
      <div className="max-w-md mx-auto space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 px-2">相談したいテーマを選択してください</h2>
        
        {Object.entries(constants_1.THEMES).map(([key, theme]) => {
            const Icon = iconMap[theme.icon];
            const colorClass = colorMap[theme.color];
            return (<card_1.Card key={key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]" onClick={() => onThemeSelect(key)}>
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 ${colorClass} rounded-full flex items-center justify-center`}>
                  <Icon className="w-6 h-6"/>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{theme.name}</h3>
                  <p className="text-sm text-secondary-text">{theme.description}</p>
                </div>
                <svg className="w-5 h-5 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </card_1.Card>);
        })}
      </div>
    </div>);
}
