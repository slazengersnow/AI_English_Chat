"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PlanConfiguration;
const react_1 = require("react");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const badge_1 = require("@/components/ui/badge");
const alert_1 = require("@/components/ui/alert");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/hooks/use-toast");
function PlanConfiguration() {
    const [plans, setPlans] = (0, react_1.useState)([
        {
            id: 'standard_monthly',
            name: 'スタンダード月額',
            displayPrice: '¥980',
            currentPriceId: 'prod_SZgeMcEAMDMlDe',
            newPriceId: '',
            stripeAmount: 980,
            currency: 'jpy',
            period: 'month',
            features: ['基本練習機能', '1日100問まで', '基本的な評価機能', '進捗記録', 'ブックマーク機能'],
            description: '基本的な英作文練習に最適なプラン',
            verified: false
        },
        {
            id: 'standard_yearly',
            name: 'スタンダード年額',
            displayPrice: '¥9,800',
            currentPriceId: 'prod_SZglW626p1IFsh',
            newPriceId: '',
            stripeAmount: 9800,
            currency: 'jpy',
            period: 'year',
            features: ['基本練習機能', '1日100問まで', '基本的な評価機能', '進捗記録', 'ブックマーク機能', '2ヶ月分お得'],
            description: '年間契約でお得に基本機能を利用',
            verified: false
        },
        {
            id: 'premium_monthly',
            name: 'プレミアム月額',
            displayPrice: '¥1,300',
            currentPriceId: 'price_1ReXPnHridtc6DvMQaW7NC6w',
            newPriceId: '',
            stripeAmount: 1300,
            currency: 'jpy',
            period: 'month',
            features: ['無制限問題', 'カスタムシナリオ作成', '詳細な分析機能', '復習機能', '優先サポート'],
            description: '全機能を利用できるプレミアムプラン',
            verified: false
        },
        {
            id: 'premium_yearly',
            name: 'プレミアム年額',
            displayPrice: '¥13,000',
            currentPriceId: 'prod_SZgnjreCBit2Bj',
            newPriceId: '',
            stripeAmount: 13000,
            currency: 'jpy',
            period: 'year',
            features: ['無制限問題', 'カスタムシナリオ作成', '詳細な分析機能', '復習機能', '優先サポート', '2ヶ月分お得'],
            description: '年間契約でプレミアム機能をお得に利用',
            verified: false
        }
    ]);
    const [isUpdating, setIsUpdating] = (0, react_1.useState)(false);
    const [availablePrices, setAvailablePrices] = (0, react_1.useState)([]);
    const [isLoadingPrices, setIsLoadingPrices] = (0, react_1.useState)(false);
    const { toast } = (0, use_toast_1.useToast)();
    const verifyPriceId = async (planId, priceId) => {
        if (!priceId.trim())
            return;
        try {
            const response = await fetch('/api/stripe/price-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: priceId.trim() })
            });
            const data = await response.json();
            if (response.ok) {
                setPlans(prev => prev.map(plan => plan.id === planId
                    ? { ...plan, verified: true, verificationResult: data }
                    : plan));
                toast({
                    title: "価格ID確認完了",
                    description: `${data.unit_amount} ${data.currency.toUpperCase()} として確認されました`
                });
            }
            else {
                setPlans(prev => prev.map(plan => plan.id === planId
                    ? { ...plan, verified: false, verificationResult: null }
                    : plan));
                toast({
                    title: "価格ID確認失敗",
                    description: data.message,
                    variant: "destructive"
                });
            }
        }
        catch (error) {
            console.error('Price verification error:', error);
            toast({
                title: "エラー",
                description: "価格IDの確認に失敗しました",
                variant: "destructive"
            });
        }
    };
    const updatePriceId = (planId, newPriceId) => {
        setPlans(prev => prev.map(plan => plan.id === planId
            ? { ...plan, newPriceId, verified: false, verificationResult: null }
            : plan));
    };
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "コピーしました",
            description: "価格IDをクリップボードにコピーしました"
        });
    };
    const saveConfiguration = async () => {
        setIsUpdating(true);
        try {
            const configData = plans.reduce((acc, plan) => {
                if (plan.newPriceId && plan.verified) {
                    acc[plan.id] = {
                        priceId: plan.newPriceId,
                        name: plan.name,
                        displayPrice: plan.displayPrice,
                        stripeAmount: plan.stripeAmount,
                        currency: plan.currency,
                        period: plan.period
                    };
                }
                return acc;
            }, {});
            const response = await fetch('/api/plan-configuration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ plans: configData })
            });
            const result = await response.json();
            if (response.ok) {
                toast({
                    title: "設定保存完了",
                    description: `${result.updated_count}個のプランが正常に更新されました`
                });
            }
            else {
                throw new Error(result.message);
            }
        }
        catch (error) {
            toast({
                title: "保存エラー",
                description: error instanceof Error ? error.message : "設定の保存に失敗しました",
                variant: "destructive"
            });
        }
        finally {
            setIsUpdating(false);
        }
    };
    const formatPrice = (amount, currency) => {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(amount);
    };
    const loadAvailablePrices = async () => {
        setIsLoadingPrices(true);
        try {
            const response = await fetch('/api/stripe-prices');
            const data = await response.json();
            if (response.ok) {
                setAvailablePrices(data.prices || []);
                toast({
                    title: "価格一覧取得完了",
                    description: `${data.prices.length}個の価格を取得しました`
                });
            }
            else {
                throw new Error(data.message);
            }
        }
        catch (error) {
            toast({
                title: "価格取得エラー",
                description: error instanceof Error ? error.message : "価格一覧の取得に失敗しました",
                variant: "destructive"
            });
        }
        finally {
            setIsLoadingPrices(false);
        }
    };
    const selectPriceId = (planId, priceId) => {
        updatePriceId(planId, priceId);
        verifyPriceId(planId, priceId);
    };
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            プラン価格ID設定
          </h1>
          <p className="text-gray-600 mb-4">
            各プランの正しい価格IDを設定してください
          </p>
          <button_1.Button onClick={loadAvailablePrices} disabled={isLoadingPrices} variant="outline" className="mb-4">
            {isLoadingPrices ? (<>
                <lucide_react_1.RefreshCw className="w-4 h-4 mr-2 animate-spin"/>
                取得中...
              </>) : (<>
                <lucide_react_1.Settings className="w-4 h-4 mr-2"/>
                Stripe価格一覧を取得
              </>)}
          </button_1.Button>
        </div>

        {availablePrices.length > 0 && (<card_1.Card className="mb-6">
            <card_1.CardHeader>
              <card_1.CardTitle>利用可能な価格ID</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {availablePrices.map((price) => (<div key={price.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-mono text-sm">{price.id}</div>
                      <div className="text-sm text-gray-600">
                        {formatPrice(price.unit_amount, price.currency)} 
                        {price.recurring && ` / ${price.recurring.interval}`}
                      </div>
                    </div>
                    <div className="space-x-2">
                      {plans.map((plan) => (<button_1.Button key={plan.id} size="sm" variant="outline" onClick={() => selectPriceId(plan.id, price.id)} className="text-xs">
                          {plan.name}
                        </button_1.Button>))}
                    </div>
                  </div>))}
              </div>
            </card_1.CardContent>
          </card_1.Card>)}

        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (<card_1.Card key={plan.id} className="relative">
              <card_1.CardHeader>
                <div className="flex items-center justify-between">
                  <card_1.CardTitle className="text-xl">{plan.name}</card_1.CardTitle>
                  <badge_1.Badge variant={plan.verified ? "default" : "secondary"}>
                    {plan.verified ? "確認済み" : "未確認"}
                  </badge_1.Badge>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {plan.displayPrice}
                </div>
                <div className="text-sm text-gray-500">
                  Stripe設定: {plan.stripeAmount} {plan.currency.toUpperCase()} ({plan.period})
                </div>
              </card_1.CardHeader>
              
              <card_1.CardContent className="space-y-4">
                <div className="space-y-2">
                  <label_1.Label className="text-sm font-medium">現在の価格ID</label_1.Label>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-sm bg-gray-100 px-3 py-2 rounded flex-1">
                      {plan.currentPriceId}
                    </div>
                    <button_1.Button size="sm" variant="outline" onClick={() => copyToClipboard(plan.currentPriceId)}>
                      <lucide_react_1.Copy className="w-4 h-4"/>
                    </button_1.Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label_1.Label className="text-sm font-medium">新しい価格ID</label_1.Label>
                  <div className="flex items-center gap-2">
                    <input_1.Input placeholder="price_1..." value={plan.newPriceId} onChange={(e) => updatePriceId(plan.id, e.target.value)} className="flex-1"/>
                    <button_1.Button size="sm" onClick={() => verifyPriceId(plan.id, plan.newPriceId)} disabled={!plan.newPriceId.trim()}>
                      <lucide_react_1.RefreshCw className="w-4 h-4 mr-2"/>
                      確認
                    </button_1.Button>
                  </div>
                </div>

                {plan.verificationResult && (<alert_1.Alert className="border-green-200">
                    <lucide_react_1.CheckCircle className="h-4 w-4"/>
                    <alert_1.AlertDescription className="text-green-700">
                      <div className="space-y-1">
                        <div className="font-semibold">確認結果:</div>
                        <div className="text-sm">
                          料金: {formatPrice(plan.verificationResult.unit_amount, plan.verificationResult.currency)}
                        </div>
                        <div className="text-sm">
                          タイプ: {plan.verificationResult.type}
                        </div>
                        <div className="text-sm">
                          アクティブ: {plan.verificationResult.active ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </alert_1.AlertDescription>
                  </alert_1.Alert>)}

                <div className="space-y-2">
                  <label_1.Label className="text-sm font-medium">機能</label_1.Label>
                  <div className="space-y-1">
                    {plan.features.map((feature, idx) => (<div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                        <lucide_react_1.CheckCircle className="w-3 h-3 text-green-500"/>
                        {feature}
                      </div>))}
                  </div>
                </div>

                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
                  {plan.description}
                </div>
              </card_1.CardContent>
            </card_1.Card>))}
        </div>

        <div className="mt-8 text-center">
          <button_1.Button onClick={saveConfiguration} disabled={isUpdating || !plans.some(p => p.verified && p.newPriceId)} className="px-8 py-3 text-lg">
            {isUpdating ? (<>
                <lucide_react_1.RefreshCw className="w-5 h-5 mr-2 animate-spin"/>
                保存中...
              </>) : (<>
                <lucide_react_1.Save className="w-5 h-5 mr-2"/>
                設定を保存
              </>)}
          </button_1.Button>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">設定手順</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. 各プランの「新しい価格ID」フィールドに正しい価格IDを入力</li>
            <li>2. 「確認」ボタンをクリックして価格IDの有効性を確認</li>
            <li>3. 全プランが確認済みになったら「設定を保存」をクリック</li>
            <li>4. 保存後、サブスクリプション選択ページで正しい価格が表示されます</li>
          </ol>
        </div>
      </div>
    </div>);
}
