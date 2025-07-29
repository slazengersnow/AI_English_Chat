"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StripeTest;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const use_toast_1 = require("@/hooks/use-toast");
const lucide_react_1 = require("lucide-react");
function StripeTest() {
    const { toast } = (0, use_toast_1.useToast)();
    const [priceId, setPriceId] = (0, react_1.useState)("");
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [testResults, setTestResults] = (0, react_1.useState)([]);
    const [availablePrices, setAvailablePrices] = (0, react_1.useState)([]);
    const [isLoadingPrices, setIsLoadingPrices] = (0, react_1.useState)(false);
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
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <card_1.Card className="w-full max-w-4xl">
        <card_1.CardHeader className="text-center">
          <card_1.CardTitle className="text-2xl flex items-center justify-center gap-2">
            <lucide_react_1.CreditCard className="w-6 h-6"/>
            Stripe決済テスト
          </card_1.CardTitle>
          <card_1.CardDescription>
            実際のStripe価格IDを使用してチェックアウトセッションの作成をテストします
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label_1.Label htmlFor="priceId">Stripe価格ID</label_1.Label>
              <input_1.Input id="priceId" placeholder="price_1OXXXXXXXXXXXXXXXXXXXXXX または prod_XXXXXXXXXXXXXXX" value={priceId} onChange={(e) => setPriceId(e.target.value)} className="mt-1"/>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">テスト用価格ID例:</h3>
              <div className="space-y-2">
                {testPriceIds.map((id, index) => (<div key={index} className="flex items-center gap-2">
                    <button_1.Button variant="outline" size="sm" onClick={() => setPriceId(id)} className="text-xs">
                      使用
                    </button_1.Button>
                    <code className="text-xs bg-white px-2 py-1 rounded">
                      {id}
                    </code>
                  </div>))}
              </div>
            </div>

            <div className="flex gap-2">
              <button_1.Button onClick={fetchAvailablePrices} disabled={isLoadingPrices} variant="outline" className="flex-1">
                {isLoadingPrices ? "取得中..." : "利用可能な価格IDを取得"}
              </button_1.Button>
              <button_1.Button onClick={testCreateCheckoutSession} disabled={isLoading} className="flex-1">
                {isLoading ? "テスト中..." : "チェックアウトセッションをテスト"}
              </button_1.Button>
            </div>
          </div>

          {availablePrices.length > 0 && (<div className="space-y-2">
              <h3 className="font-semibold">利用可能な価格ID一覧:</h3>
              <div className="bg-white border rounded-lg p-4 max-h-60 overflow-auto">
                {availablePrices.map((price, index) => (<div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {price.id}
                      </code>
                      <div className="text-xs text-gray-500 mt-1">
                        {price.unit_amount
                    ? `\u00a5${price.unit_amount / 100}`
                    : "無料"}
                        {price.recurring && ` / ${price.recurring.interval}`}
                        {price.active ? " (有効)" : " (無効)"}
                      </div>
                    </div>
                    <button_1.Button size="sm" variant="outline" onClick={() => setPriceId(price.id)}>
                      使用
                    </button_1.Button>
                  </div>))}
              </div>
            </div>)}

          {testResults.length > 0 && (<div className="space-y-2">
              <h3 className="font-semibold">テスト結果:</h3>
              <div className="bg-white border rounded-lg p-4 max-h-96 overflow-auto">
                {testResults.map((result, index) => (<div key={index} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                    {result.success ? (<lucide_react_1.CheckCircle className="w-5 h-5 text-green-500 mt-0.5"/>) : (<lucide_react_1.AlertCircle className="w-5 h-5 text-red-500 mt-0.5"/>)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.step}</div>
                      <div className="text-sm text-gray-600 whitespace-pre-line">
                        {result.message}
                      </div>
                      {result.details && (<div className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded">
                          <pre>{JSON.stringify(result.details, null, 2)}</pre>
                        </div>)}
                      <div className="text-xs text-gray-400">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>))}
              </div>
            </div>)}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">テスト情報</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 実際のStripe価格IDを使用してテストします</li>
              <li>• 7日間の無料トライアル期間が設定されます</li>
              <li>
                • 成功した場合、新しいタブでチェックアウトページが開きます
              </li>
              <li>• 価格IDは Stripe ダッシュボードから確認できます</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">
              価格ID取得方法
            </h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Stripeダッシュボード → 商品 → 価格</li>
              <li>2. 価格IDをコピー（price_xxx または prod_xxx）</li>
              <li>3. 上記のフォームに貼り付けてテスト</li>
            </ol>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
