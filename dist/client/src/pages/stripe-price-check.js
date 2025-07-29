"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StripePriceCheck;
const react_1 = require("react");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const alert_1 = require("@/components/ui/alert");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/hooks/use-toast");
function StripePriceCheck() {
    const [priceId, setPriceId] = (0, react_1.useState)('');
    const [priceInfo, setPriceInfo] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const { toast } = (0, use_toast_1.useToast)();
    const checkPrice = async () => {
        if (!priceId.trim()) {
            setError('価格IDを入力してください');
            return;
        }
        setLoading(true);
        setError(null);
        setPriceInfo(null);
        try {
            const response = await fetch('/api/stripe/price-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ priceId: priceId.trim() })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch price info');
            }
            setPriceInfo(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
        finally {
            setLoading(false);
        }
    };
    const formatPrice = (amount, currency) => {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(amount / 100);
    };
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "コピーしました",
            description: "価格IDをクリップボードにコピーしました"
        });
    };
    // 推奨価格ID設定
    const recommendedPrices = [
        { name: "スタンダード月額", amount: 980, currency: "jpy" },
        { name: "スタンダード年額", amount: 9800, currency: "jpy" },
        { name: "プレミアム月額", amount: 1300, currency: "jpy" },
        { name: "プレミアム年額", amount: 13000, currency: "jpy" }
    ];
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <card_1.Card className="mb-6">
          <card_1.CardHeader>
            <card_1.CardTitle className="text-2xl">Stripe価格ID確認ツール</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label_1.Label htmlFor="priceId">価格ID</label_1.Label>
                <div className="flex gap-2">
                  <input_1.Input id="priceId" placeholder="price_1ReXPnHridtc6DvMQaW7NC6w" value={priceId} onChange={(e) => setPriceId(e.target.value)} className="flex-1"/>
                  <button_1.Button onClick={checkPrice} disabled={loading}>
                    {loading ? "確認中..." : "確認"}
                  </button_1.Button>
                </div>
              </div>

              {error && (<alert_1.Alert className="border-red-200">
                  <lucide_react_1.AlertCircle className="h-4 w-4"/>
                  <alert_1.AlertDescription className="text-red-700">
                    {error}
                  </alert_1.AlertDescription>
                </alert_1.Alert>)}

              {priceInfo && (<alert_1.Alert className="border-green-200">
                  <lucide_react_1.CheckCircle className="h-4 w-4"/>
                  <alert_1.AlertDescription className="text-green-700">
                    <div className="space-y-2">
                      <div className="font-semibold">価格情報:</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>価格ID: {priceInfo.id}</div>
                        <div>料金: {formatPrice(priceInfo.unit_amount, priceInfo.currency)}</div>
                        <div>通貨: {priceInfo.currency.toUpperCase()}</div>
                        <div>タイプ: {priceInfo.type}</div>
                        <div>商品ID: {priceInfo.product}</div>
                        <div>アクティブ: {priceInfo.active ? 'Yes' : 'No'}</div>
                      </div>
                      <button_1.Button size="sm" variant="outline" onClick={() => copyToClipboard(priceInfo.id)} className="mt-2">
                        <lucide_react_1.Copy className="w-4 h-4 mr-2"/>
                        価格IDをコピー
                      </button_1.Button>
                    </div>
                  </alert_1.AlertDescription>
                </alert_1.Alert>)}
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>推奨価格設定</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                以下の料金でStripeの価格IDを作成してください：
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedPrices.map((price, index) => (<div key={index} className="p-4 border rounded-lg">
                    <div className="font-semibold text-lg">{price.name}</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPrice(price.amount, price.currency)}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Stripe設定: {price.amount} {price.currency.toUpperCase()}
                    </div>
                  </div>))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="font-semibold text-yellow-800 mb-2">重要な注意事項:</div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 日本円の場合、Stripeでは最小単位（円）で設定します</li>
                  <li>• ¥1,300の場合、Stripeでは 1300 と入力</li>
                  <li>• ¥13,000の場合、Stripeでは 13000 と入力</li>
                  <li>• 価格IDは "price_" で始まる文字列です</li>
                  <li>• 商品IDは "prod_" で始まる文字列です</li>
                </ul>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
