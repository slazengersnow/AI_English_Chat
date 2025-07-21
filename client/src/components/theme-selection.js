import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/card";
import { User, Zap, Lightbulb, TrendingUp, Heart } from "lucide-react";
import { THEMES } from "@/lib/constants";
const iconMap = {
    user: User,
    zap: Zap,
    lightbulb: Lightbulb,
    'trending-up': TrendingUp,
    heart: Heart,
};
const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
};
export function ThemeSelection({ onThemeSelect }) {
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-line-green/10 to-blue-50 p-4", children: [_jsx("div", { className: "max-w-md mx-auto pt-8 pb-6", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-line-green rounded-full mx-auto mb-4 flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-white", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" }) }) }), _jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-2", children: "AI\u30AD\u30E3\u30EA\u30A2\u958B\u767A\u652F\u63F4" }), _jsx("p", { className: "text-secondary-text text-sm", children: "\u3042\u306A\u305F\u306E\u30AD\u30E3\u30EA\u30A2\u3092\u30B5\u30DD\u30FC\u30C8\u3057\u307E\u3059" })] }) }), _jsxs("div", { className: "max-w-md mx-auto space-y-3", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4 px-2", children: "\u76F8\u8AC7\u3057\u305F\u3044\u30C6\u30FC\u30DE\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044" }), Object.entries(THEMES).map(([key, theme]) => {
                        const Icon = iconMap[theme.icon];
                        const colorClass = colorMap[theme.color];
                        return (_jsx(Card, { className: "bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]", onClick: () => onThemeSelect(key), children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `w-12 h-12 ${colorClass} rounded-full flex items-center justify-center`, children: _jsx(Icon, { className: "w-6 h-6" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: theme.name }), _jsx("p", { className: "text-sm text-secondary-text", children: theme.description })] }), _jsx("svg", { className: "w-5 h-5 text-secondary-text", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5l7 7-7 7" }) })] }) }, key));
                    })] })] }));
}
