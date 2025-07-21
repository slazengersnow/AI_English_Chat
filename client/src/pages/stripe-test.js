import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, CreditCard } from "lucide-react";
export default function StripeTest() {
    const { toast } = useToast();
    const [priceId, setPriceId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [testResults, setTestResults] = useState([]);
    const [availablePrices, setAvailablePrices] = useState([]);
    const [isLoadingPrices, setIsLoadingPrices] = useState(false);
    const addResult = (step, success, message, details) => {
        setTestResults((prev) => [
            ...prev,
            {
                step,
                success,
                message,
                details,
                timestamp: new Date().toISOString(),
            },
        ]);
    };
    const testCreateCheckoutSession = async () => {
        if (!priceId.trim()) {
            toast({
                title: "エラー",
                description: "価格IDを入力してください",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);
        setTestResults([]);
        try {
            addResult("セッション作成開始", true, `価格ID: ${priceId}`);
            const response = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    priceId: priceId,
                    successUrl: `${window.location.origin}/success`,
                    cancelUrl: `${window.location.origin}/cancel`,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                addResult("セッション作成", false, `エラー: ${data.message}`, data);
                throw new Error(data.message);
            }
            addResult("セッション作成", true, "セッションが正常に作成されました", data);
            if (data.url) {
                addResult("リダイレクト", true, "Stripeチェックアウトページへリダイレクト中...");
                toast({
                    title: "成功",
                    description: "Stripeチェックアウトページを開きます",
                });
                window.open(data.url, "_blank");
            }
            else {
                addResult("リダイレクト", false, "チェックアウトURLが見つかりません");
            }
        }
        catch (error) {
            console.error("Stripe test error:", error);
            addResult("エラー", false, `テストエラー: ${error.message}`);
            toast({
                title: "テスト失敗",
                description: error.message,
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const fetchAvailablePrices = async () => {
        setIsLoadingPrices(true);
        try {
            const response = await fetch("/api/stripe-prices");
            const data = await response.json();
            if (response.ok) {
                setAvailablePrices(data.prices || []);
                addResult("価格ID取得", true, `${data.account_type}環境から${data.total_prices}個の価格IDを取得しました`, data);
            }
            else {
                addResult("価格ID取得", false, `エラー: ${data.message}`, data);
            }
        }
        catch (error) {
            addResult("価格ID取得", false, `価格ID取得エラー: ${error.message}`);
        }
        finally {
            setIsLoadingPrices(false);
        }
    };
    const testPriceIds = [
        "price_1ReXPnHridtc6DvMQaW7NC6w",
        "price_1OXXXXXXXXXXXXXXXXXXXXXX",
        "prod_SZgm74ZfQCQMSP",
        "prod_SZgeMcEAMDMlDe",
    ];
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-4xl", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsxs(CardTitle, { className: "text-2xl flex items-center justify-center gap-2", children: [_jsx(CreditCard, { className: "w-6 h-6" }), "Stripe\u6C7A\u6E08\u30C6\u30B9\u30C8"] }), _jsx(CardDescription, { children: "\u5B9F\u969B\u306EStripe\u4FA1\u683CID\u3092\u4F7F\u7528\u3057\u3066\u30C1\u30A7\u30C3\u30AF\u30A2\u30A6\u30C8\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u4F5C\u6210\u3092\u30C6\u30B9\u30C8\u3057\u307E\u3059" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "priceId", children: "Stripe\u4FA1\u683CID" }), _jsx(Input, { id: "priceId", placeholder: "price_1OXXXXXXXXXXXXXXXXXXXXXX \u307E\u305F\u306F prod_XXXXXXXXXXXXXXX", value: priceId, onChange: (e) => setPriceId(e.target.value), className: "mt-1" })] }), _jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsx("h3", { className: "font-semibold mb-2", children: "\u30C6\u30B9\u30C8\u7528\u4FA1\u683CID\u4F8B:" }), _jsx("div", { className: "space-y-2", children: testPriceIds.map((id, index) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPriceId(id), className: "text-xs", children: "\u4F7F\u7528" }), _jsx("code", { className: "text-xs bg-white px-2 py-1 rounded", children: id })] }, index))) })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { onClick: fetchAvailablePrices, disabled: isLoadingPrices, variant: "outline", className: "flex-1", children: isLoadingPrices ? "取得中..." : "利用可能な価格IDを取得" }), _jsx(Button, { onClick: testCreateCheckoutSession, disabled: isLoading, className: "flex-1", children: isLoading ? "テスト中..." : "チェックアウトセッションをテスト" })] })] }), availablePrices.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "font-semibold", children: "\u5229\u7528\u53EF\u80FD\u306A\u4FA1\u683CID\u4E00\u89A7:" }), _jsx("div", { className: "bg-white border rounded-lg p-4 max-h-60 overflow-auto", children: availablePrices.map((price, index) => (_jsxs("div", { className: "flex items-center justify-between py-2 border-b last:border-b-0", children: [_jsxs("div", { children: [_jsx("code", { className: "text-sm font-mono bg-gray-100 px-2 py-1 rounded", children: price.id }), _jsxs("div", { className: "text-xs text-gray-500 mt-1", children: [price.unit_amount
                                                                ? `\u00a5${price.unit_amount / 100}`
                                                                : "無料", price.recurring && ` / ${price.recurring.interval}`, price.active ? " (有効)" : " (無効)"] })] }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => setPriceId(price.id), children: "\u4F7F\u7528" })] }, index))) })] })), testResults.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "font-semibold", children: "\u30C6\u30B9\u30C8\u7D50\u679C:" }), _jsx("div", { className: "bg-white border rounded-lg p-4 max-h-96 overflow-auto", children: testResults.map((result, index) => (_jsxs("div", { className: "flex items-start gap-3 py-2 border-b last:border-b-0", children: [result.success ? (_jsx(CheckCircle, { className: "w-5 h-5 text-green-500 mt-0.5" })) : (_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 mt-0.5" })), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium text-sm", children: result.step }), _jsx("div", { className: "text-sm text-gray-600 whitespace-pre-line", children: result.message }), result.details && (_jsx("div", { className: "text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded", children: _jsx("pre", { children: JSON.stringify(result.details, null, 2) }) })), _jsx("div", { className: "text-xs text-gray-400", children: new Date(result.timestamp).toLocaleTimeString() })] })] }, index))) })] })), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-blue-800 mb-2", children: "\u30C6\u30B9\u30C8\u60C5\u5831" }), _jsxs("ul", { className: "text-sm text-blue-700 space-y-1", children: [_jsx("li", { children: "\u2022 \u5B9F\u969B\u306EStripe\u4FA1\u683CID\u3092\u4F7F\u7528\u3057\u3066\u30C6\u30B9\u30C8\u3057\u307E\u3059" }), _jsx("li", { children: "\u2022 7\u65E5\u9593\u306E\u7121\u6599\u30C8\u30E9\u30A4\u30A2\u30EB\u671F\u9593\u304C\u8A2D\u5B9A\u3055\u308C\u307E\u3059" }), _jsx("li", { children: "\u2022 \u6210\u529F\u3057\u305F\u5834\u5408\u3001\u65B0\u3057\u3044\u30BF\u30D6\u3067\u30C1\u30A7\u30C3\u30AF\u30A2\u30A6\u30C8\u30DA\u30FC\u30B8\u304C\u958B\u304D\u307E\u3059" }), _jsx("li", { children: "\u2022 \u4FA1\u683CID\u306F Stripe \u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u304B\u3089\u78BA\u8A8D\u3067\u304D\u307E\u3059" })] })] }), _jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-yellow-800 mb-2", children: "\u4FA1\u683CID\u53D6\u5F97\u65B9\u6CD5" }), _jsxs("ol", { className: "text-sm text-yellow-700 space-y-1", children: [_jsx("li", { children: "1. Stripe\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9 \u2192 \u5546\u54C1 \u2192 \u4FA1\u683C" }), _jsx("li", { children: "2. \u4FA1\u683CID\u3092\u30B3\u30D4\u30FC\uFF08price_xxx \u307E\u305F\u306F prod_xxx\uFF09" }), _jsx("li", { children: "3. \u4E0A\u8A18\u306E\u30D5\u30A9\u30FC\u30E0\u306B\u8CBC\u308A\u4ED8\u3051\u3066\u30C6\u30B9\u30C8" })] })] })] })] }) }));
}
