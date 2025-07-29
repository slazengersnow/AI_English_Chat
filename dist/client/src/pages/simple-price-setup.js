"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SimplePriceSetup;
const react_1 = require("react");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const badge_1 = require("@/components/ui/badge");
const alert_1 = require("@/components/ui/alert");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/hooks/use-toast");
function SimplePriceSetup() {
    const [currentMode, setCurrentMode] = (0, react_1.useState)('test');
    const [plans, setPlans] = (0, react_1.useState)([
        {
            id: 'standard_monthly',
            name: 'スタンダード月額',
            displayPrice: '¥980',
            description: '1日50問まで、基本練習機能',
            currentPriceId: 'price_1RjslTHridtc6DvMCNUU778G',
            newPriceId: 'price_1RjslTHridtc6DvMCNUU778G',
            verified: false
        },
        {
            id: 'standard_yearly',
            name: 'スタンダード年間',
            displayPrice: '¥9,800',
            description: '1日50問まで、基本練習機能（2ヶ月分お得）',
            currentPriceId: 'price_1RjsmiHridtc6DvMWQXBcaJ1',
            newPriceId: 'price_1RjsmiHridtc6DvMWQXBcaJ1',
            verified: false
        },
        {
            id: 'premium_monthly',
            name: 'プレミアム月額',
            displayPrice: '¥1,300',
            description: '1日100問まで、カスタムシナリオ・復習機能',
            currentPriceId: 'price_1RjslwHridtc6DvMshQinr44',
            newPriceId: 'price_1RjslwHridtc6DvMshQinr44',
            verified: false
        },
        {
            id: 'premium_yearly',
            name: 'プレミアム年間',
            displayPrice: '¥13,000',
            description: '1日100問まで、全機能（2ヶ月分お得）',
            currentPriceId: 'price_1Rjsn6Hridtc6DvMGQJaqBid',
            newPriceId: 'price_1Rjsn6Hridtc6DvMGQJaqBid',
            verified: false
        }
    ]);
    const [isUpdating, setIsUpdating] = (0, react_1.useState)(false);
    const [availablePrices, setAvailablePrices] = (0, react_1.useState)([]);
    const [isLoadingPrices, setIsLoadingPrices] = (0, react_1.useState)(false);
    const { toast } = (0, use_toast_1.useToast)();
    // Price configurations for easy switching
    const testPrices = {
        standard_monthly: 'price_1RjslTHridtc6DvMCNUU778G',
        standard_yearly: 'price_1RjsmiHridtc6DvMWQXBcaJ1',
        premium_monthly: 'price_1RjslwHridtc6DvMshQinr44',
        premium_yearly: 'price_1Rjsn6Hridtc6DvMGQJaqBid'
    };
    const productionPrices = {
        standard_monthly: 'price_1ReXHSHridtc6DvMOjCbo2VK',
        standard_yearly: 'price_1ReXOGHridtc6DvM8L2KO7KO',
        premium_monthly: 'price_1ReXP9Hridtc6DvMpgawL58K',
        premium_yearly: 'price_1ReXPnHridtc6DvMQaW7NC6w'
    };
    // Load current configuration
    (0, react_1.useEffect)(() => {
        const loadCurrentConfig = async () => {
            try {
                const response = await fetch('/api/subscription-plans');
                const data = await response.json();
                setPlans(prev => prev.map(plan => ({
                    ...plan,
                    currentPriceId: data[plan.id]?.priceId || '',
                    newPriceId: data[plan.id]?.priceId || ''
                })));
            }
            catch (error) {
                console.error('Failed to load current config:', error);
            }
        };
        loadCurrentConfig();
    }, []);
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
    const fetchAvailablePrices = async () => {
        setIsLoadingPrices(true);
        try {
            const response = await fetch('/api/stripe/prices');
            const data = await response.json();
            if (response.ok) {
                setAvailablePrices(data.prices || []);
                toast({
                    title: "価格一覧取得完了",
                    description: `${data.prices?.length || 0}件の価格が取得されました`
                });
            }
            else {
                toast({
                    title: "エラー",
                    description: data.message || "価格一覧の取得に失敗しました",
                    variant: "destructive"
                });
            }
        }
        catch (error) {
            console.error('Failed to fetch prices:', error);
            toast({
                title: "エラー",
                description: "価格一覧の取得に失敗しました",
                variant: "destructive"
            });
        }
        finally {
            setIsLoadingPrices(false);
        }
    };
    const assignPriceId = (planId, priceId) => {
        updatePriceId(planId, priceId);
        toast({
            title: "価格ID割り当て完了",
            description: `${priceId} を割り当てました`
        });
    };
    const switchMode = async (mode) => {
        setIsUpdating(true);
        try {
            const priceIds = mode === 'test' ? testPrices : productionPrices;
            const response = await fetch('/api/save-price-configuration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode,
                    ...priceIds
                })
            });
            const data = await response.json();
            if (response.ok) {
                setCurrentMode(mode);
                // Update plans with new price IDs
                setPlans(prev => prev.map(plan => ({
                    ...plan,
                    currentPriceId: priceIds[plan.id],
                    newPriceId: priceIds[plan.id]
                })));
                toast({
                    title: `${mode === 'test' ? 'テスト' : '本番'}モードに切り替えました`,
                    description: `${mode === 'test' ? '¥0のテスト価格' : '実際の料金'}で決済されます`,
                    duration: 3000,
                });
            }
            else {
                toast({
                    title: "切り替え失敗",
                    description: data.message,
                    variant: "destructive",
                    duration: 3000,
                });
            }
        }
        catch (error) {
            console.error('Mode switch error:', error);
            toast({
                title: "切り替え失敗",
                description: "モードの切り替え中にエラーが発生しました",
                variant: "destructive",
                duration: 3000,
            });
        }
        finally {
            setIsUpdating(false);
        }
    };
    const saveConfiguration = async () => {
        setIsUpdating(true);
        try {
            const configData = plans.reduce((acc, plan) => {
                if (plan.newPriceId.trim()) {
                    acc[plan.id] = plan.newPriceId.trim();
                }
                return acc;
            }, {});
            const response = await fetch('/api/save-price-configuration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ priceIds: configData })
            });
            const result = await response.json();
            if (response.ok) {
                toast({
                    title: "設定保存完了",
                    description: "価格ID設定が保存されました。新しい設定でプラン選択ページが更新されます。"
                });
                // Update current price IDs
                setPlans(prev => prev.map(plan => ({
                    ...plan,
                    currentPriceId: plan.newPriceId || plan.currentPriceId
                })));
            }
            else {
                toast({
                    title: "保存エラー",
                    description: result.message || "設定の保存に失敗しました",
                    variant: "destructive"
                });
            }
        }
        catch (error) {
            console.error('Save configuration error:', error);
            toast({
                title: "エラー",
                description: "設定の保存に失敗しました",
                variant: "destructive"
            });
        }
        finally {
            setIsUpdating(false);
        }
    };
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "コピーしました",
            description: "価格IDをクリップボードにコピーしました"
        });
    };
    return (<div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">価格ID設定</h1>
          <p className="text-gray-600">各プランの価格IDを設定してください</p>
        </div>

        {/* Mode Switch Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">モード切り替え</h2>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${currentMode === 'test' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className={`text-sm font-medium ${currentMode === 'test' ? 'text-green-700' : 'text-gray-500'}`}>
                テストモード（¥0）
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${currentMode === 'production' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <span className={`text-sm font-medium ${currentMode === 'production' ? 'text-blue-700' : 'text-gray-500'}`}>
                本番モード（実際の料金）
              </span>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button_1.Button onClick={() => switchMode('test')} disabled={isUpdating || currentMode === 'test'} className="bg-green-600 hover:bg-green-700 text-white">
              {isUpdating ? 'switching...' : 'テストモードに切り替え'}
            </button_1.Button>
            <button_1.Button onClick={() => switchMode('production')} disabled={isUpdating || currentMode === 'production'} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isUpdating ? 'switching...' : '本番モードに切り替え'}
            </button_1.Button>
          </div>
        </div>

        <alert_1.Alert className="mb-6">
          <lucide_react_1.AlertCircle className="h-4 w-4"/>
          <alert_1.AlertDescription>
            <strong>重要:</strong> 価格IDは「price_」で始まるIDを使用してください。「prod_」で始まるProduct IDは使用できません。
          </alert_1.AlertDescription>
        </alert_1.Alert>

        <div className="grid gap-6 mb-8">
          {plans.map((plan) => (<card_1.Card key={plan.id} className="border-2 hover:border-blue-200 transition-colors">
              <card_1.CardHeader className="pb-3">
                <card_1.CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <lucide_react_1.DollarSign className="h-5 w-5 text-green-600"/>
                    <div>
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <p className="text-sm text-gray-600 font-normal">{plan.description}</p>
                    </div>
                  </div>
                  <badge_1.Badge variant="outline" className="text-lg font-semibold">
                    {plan.displayPrice}
                  </badge_1.Badge>
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label_1.Label htmlFor={`current-${plan.id}`} className="text-sm font-medium">
                      現在の価格ID
                    </label_1.Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input_1.Input id={`current-${plan.id}`} value={plan.currentPriceId} readOnly className="bg-gray-50" placeholder="未設定"/>
                      {plan.currentPriceId && (<button_1.Button variant="outline" size="sm" onClick={() => copyToClipboard(plan.currentPriceId)}>
                          <lucide_react_1.Copy className="h-4 w-4"/>
                        </button_1.Button>)}
                    </div>
                  </div>
                  
                  <div>
                    <label_1.Label htmlFor={`new-${plan.id}`} className="text-sm font-medium">
                      新しい価格ID
                    </label_1.Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input_1.Input id={`new-${plan.id}`} value={plan.newPriceId} onChange={(e) => updatePriceId(plan.id, e.target.value)} placeholder="price_xxxxxxxxxxxxxxxx" className="flex-1"/>
                      <button_1.Button variant="outline" size="sm" onClick={() => verifyPriceId(plan.id, plan.newPriceId)} disabled={!plan.newPriceId.trim()}>
                        確認
                      </button_1.Button>
                    </div>
                  </div>
                </div>

                {plan.verified && plan.verificationResult && (<alert_1.Alert className="bg-green-50 border-green-200">
                    <lucide_react_1.CheckCircle className="h-4 w-4 text-green-600"/>
                    <alert_1.AlertDescription className="text-green-800">
                      <strong>確認完了:</strong> {plan.verificationResult.unit_amount} {plan.verificationResult.currency.toUpperCase()}
                      {plan.verificationResult.recurring?.interval && ` / ${plan.verificationResult.recurring.interval}`}
                    </alert_1.AlertDescription>
                  </alert_1.Alert>)}

                {plan.newPriceId && !plan.verified && (<alert_1.Alert className="bg-yellow-50 border-yellow-200">
                    <lucide_react_1.AlertCircle className="h-4 w-4 text-yellow-600"/>
                    <alert_1.AlertDescription className="text-yellow-800">
                      価格IDを確認してください
                    </alert_1.AlertDescription>
                  </alert_1.Alert>)}
              </card_1.CardContent>
            </card_1.Card>))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <button_1.Button onClick={fetchAvailablePrices} disabled={isLoadingPrices} variant="outline" className="w-full sm:w-auto">
            {isLoadingPrices ? (<>
                <lucide_react_1.RefreshCw className="h-4 w-4 mr-2 animate-spin"/>
                取得中...
              </>) : (<>
                <lucide_react_1.RefreshCw className="h-4 w-4 mr-2"/>
                Stripe価格一覧を取得
              </>)}
          </button_1.Button>
          
          <button_1.Button onClick={saveConfiguration} disabled={isUpdating || !plans.some(p => p.newPriceId.trim())} className="w-full sm:w-auto">
            {isUpdating ? (<>
                <lucide_react_1.RefreshCw className="h-4 w-4 mr-2 animate-spin"/>
                保存中...
              </>) : (<>
                <lucide_react_1.Save className="h-4 w-4 mr-2"/>
                設定を保存
              </>)}
          </button_1.Button>
        </div>

        {availablePrices.length > 0 && (<card_1.Card className="mb-6">
            <card_1.CardHeader>
              <card_1.CardTitle>利用可能な価格ID一覧</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-2">
                {availablePrices.map((price) => (<div key={price.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-mono text-sm">{price.id}</div>
                      <div className="text-sm text-gray-600">
                        {price.unit_amount} {price.currency.toUpperCase()}
                        {price.recurring?.interval && ` / ${price.recurring.interval}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button_1.Button variant="outline" size="sm" onClick={() => copyToClipboard(price.id)}>
                        <lucide_react_1.Copy className="h-4 w-4"/>
                      </button_1.Button>
                      <select className="px-2 py-1 text-sm border rounded" onChange={(e) => e.target.value && assignPriceId(e.target.value, price.id)} value="">
                        <option value="">割り当て</option>
                        {plans.map(plan => (<option key={plan.id} value={plan.id}>
                            {plan.name}
                          </option>))}
                      </select>
                    </div>
                  </div>))}
              </div>
            </card_1.CardContent>
          </card_1.Card>)}

        <div className="text-center">
          <p className="text-sm text-gray-600">
            設定完了後、
            <a href="/subscription-select" className="text-blue-600 hover:underline mx-1">
              プラン選択ページ
            </a>
            で新しい価格設定を確認できます。
          </p>
        </div>
      </div>
    </div>);
}
