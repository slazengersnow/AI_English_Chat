import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
export default function PriceCheck() {
    const [priceData, setPriceData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const checkPriceDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/stripe-prices');
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch price data');
            }
            setPriceData(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
        finally {
            setIsLoading(false);
        }
    };
    const formatPrice = (unitAmount, currency) => {
        if (!unitAmount)
            return '無料';
        // JPY currency doesn't use decimal places in Stripe
        if (currency === 'jpy') {
            return `¥${unitAmount.toLocaleString()}`;
        }
        // Other currencies use cents/smallest unit
        return `${(unitAmount / 100).toFixed(2)} ${currency.toUpperCase()}`;
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-4xl", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsxs(CardTitle, { className: "text-2xl flex items-center justify-center gap-2", children: [_jsx(DollarSign, { className: "w-6 h-6" }), "Stripe\u4FA1\u683C\u8A2D\u5B9A\u78BA\u8A8D"] }), _jsx(CardDescription, { children: "\u73FE\u5728\u306EStripe\u30A2\u30AB\u30A6\u30F3\u30C8\u306E\u4FA1\u683C\u8A2D\u5B9A\u3092\u78BA\u8A8D\u3057\u3001\u6B63\u3057\u3044\u91D1\u984D\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u308B\u304B\u30C1\u30A7\u30C3\u30AF\u3057\u307E\u3059" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsx("div", { className: "text-center", children: _jsx(Button, { onClick: checkPriceDetails, disabled: isLoading, className: "w-full max-w-md", children: isLoading ? "確認中..." : "価格設定を確認" }) }), error && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-red-800", children: "\u30A8\u30E9\u30FC" }), _jsx("p", { className: "text-red-700", children: error })] })] })), priceData && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsxs("h3", { className: "font-semibold text-blue-800 mb-2 flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-5 h-5" }), "\u30A2\u30AB\u30A6\u30F3\u30C8\u60C5\u5831"] }), _jsxs("div", { className: "text-sm text-blue-700", children: [_jsxs("p", { children: ["\u74B0\u5883: ", _jsx("span", { className: "font-mono", children: priceData.account_type })] }), _jsxs("p", { children: ["\u4FA1\u683C\u6570: ", priceData.total_prices, "\u500B"] })] })] }), _jsxs("div", { className: "bg-white border rounded-lg overflow-hidden", children: [_jsx("div", { className: "bg-gray-50 px-4 py-3 border-b", children: _jsx("h3", { className: "font-semibold", children: "\u4FA1\u683C\u4E00\u89A7" }) }), _jsx("div", { className: "max-h-96 overflow-auto", children: priceData.prices.map((price, index) => (_jsx("div", { className: "border-b last:border-b-0 p-4", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("code", { className: "text-sm font-mono bg-gray-100 px-2 py-1 rounded", children: price.id }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${price.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`, children: price.active ? '有効' : '無効' })] }), _jsx("div", { className: "text-lg font-semibold text-gray-900", children: formatPrice(price.unit_amount, price.currency) }), price.recurring && (_jsxs("div", { className: "text-sm text-gray-600 mt-1", children: ["\u8ACB\u6C42\u9593\u9694: ", price.recurring.interval, price.recurring.interval_count > 1 &&
                                                                            ` (${price.recurring.interval_count}${price.recurring.interval}毎)`] })), _jsxs("div", { className: "text-xs text-gray-500 mt-2", children: ["\u5546\u54C1ID: ", price.product] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-xs text-gray-500", children: price.type === 'recurring' ? '定期' : '一回' }), price.id === 'price_1ReXPnHridtc6DvMQaW7NC6w' && (_jsx("div", { className: "text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-1", children: "\u4F7F\u7528\u4E2D" }))] })] }) }, index))) })] }), _jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-yellow-800 mb-2", children: "\u4FA1\u683C\u8A2D\u5B9A\u306E\u6CE8\u610F\u70B9" }), _jsxs("ul", { className: "text-sm text-yellow-700 space-y-1", children: [_jsx("li", { children: "\u2022 JPY\u901A\u8CA8\u306E\u5834\u5408\u3001Stripe\u306F\u5186\u5358\u4F4D\u3067\u4FA1\u683C\u3092\u4FDD\u5B58\u3057\u307E\u3059" }), _jsx("li", { children: "\u2022 \u00A51,300\u306E\u5834\u5408\u3001unit_amount\u306F\u300C1300\u300D\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059" }), _jsx("li", { children: "\u2022 \u73FE\u5728\u300C13000\u300D\u306B\u306A\u3063\u3066\u3044\u308B\u5834\u5408\u3001\u00A513,000\u3068\u3057\u3066\u8868\u793A\u3055\u308C\u307E\u3059" }), _jsx("li", { children: "\u2022 \u4FA1\u683C\u3092\u4FEE\u6B63\u3059\u308B\u306B\u306F\u3001Stripe\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u3067\u65B0\u3057\u3044\u4FA1\u683C\u3092\u4F5C\u6210\u3059\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059" })] })] })] }))] })] }) }));
}
