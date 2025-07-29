"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StripeCheckoutDebug;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const alert_1 = require("@/components/ui/alert");
const lucide_react_1 = require("lucide-react");
function StripeCheckoutDebug() {
    const [checkoutUrl, setCheckoutUrl] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [debugInfo, setDebugInfo] = (0, react_1.useState)({});
    (0, react_1.useEffect)(() => {
        const info = {
            userAgent: navigator.userAgent,
            cookiesEnabled: navigator.cookieEnabled,
            javaScriptEnabled: true,
            currentUrl: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
        };
        setDebugInfo(info);
    }, []);
    const createCheckoutSession = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: 'price_1ReXPnHridtc6DvMQaW7NC6w',
                    successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${window.location.origin}/payment-cancelled`
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create checkout session');
            }
            console.log('Checkout session created:', data);
            setCheckoutUrl(data.url);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            console.error('Checkout error:', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    const openCheckoutInNewTab = () => {
        if (checkoutUrl) {
            window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
        }
    };
    const redirectToCheckout = () => {
        if (checkoutUrl) {
            window.location.href = checkoutUrl;
        }
    };
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <card_1.Card className="mb-6">
          <card_1.CardHeader>
            <card_1.CardTitle className="text-2xl">Stripe Checkout Debug</card_1.CardTitle>
            <card_1.CardDescription>
              Stripeチェックアウトページの表示問題を診断・修正
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="font-semibold">環境情報</h3>
                {Object.entries(debugInfo).map(([key, value]) => (<div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600">{key}:</span>
                    <span className="text-gray-800 font-mono max-w-xs truncate">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </span>
                  </div>))}
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold">チェックアウトテスト</h3>
                <button_1.Button onClick={createCheckoutSession} disabled={isLoading} className="w-full">
                  {isLoading ? "セッション作成中..." : "チェックアウトセッションを作成"}
                </button_1.Button>
                
                {error && (<alert_1.Alert className="border-red-200">
                    <lucide_react_1.AlertCircle className="h-4 w-4"/>
                    <alert_1.AlertDescription className="text-red-700">
                      {error}
                    </alert_1.AlertDescription>
                  </alert_1.Alert>)}
                
                {checkoutUrl && (<div className="space-y-3">
                    <alert_1.Alert className="border-green-200">
                      <lucide_react_1.CheckCircle className="h-4 w-4"/>
                      <alert_1.AlertDescription className="text-green-700">
                        チェックアウトURLが正常に作成されました
                      </alert_1.AlertDescription>
                    </alert_1.Alert>
                    
                    <div className="space-y-2">
                      <button_1.Button onClick={openCheckoutInNewTab} variant="outline" className="w-full">
                        <lucide_react_1.ExternalLink className="w-4 h-4 mr-2"/>
                        新しいタブで開く（推奨）
                      </button_1.Button>
                      
                      <button_1.Button onClick={redirectToCheckout} className="w-full">
                        このページでリダイレクト
                      </button_1.Button>
                    </div>
                    
                    <div className="text-xs text-gray-500 font-mono p-2 bg-gray-100 rounded">
                      {checkoutUrl}
                    </div>
                  </div>)}
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>よくある問題と解決策</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">問題：チェックアウトページが影のように見える</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• ブラウザのセキュリティ設定でiframeがブロックされている</li>
                  <li>• JavaScriptが無効化されている</li>
                  <li>• 広告ブロッカーがStripeのスクリプトをブロックしている</li>
                  <li>• CookieやLocalStorageが無効化されている</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">解決策</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 新しいタブでチェックアウトページを開く</li>
                  <li>• 広告ブロッカーを一時的に無効化</li>
                  <li>• プライベート/シークレットモードを試す</li>
                  <li>• 別のブラウザを使用</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">テスト手順</h4>
                <ol className="text-sm text-green-700 space-y-1">
                  <li>1. 上記のボタンでチェックアウトセッションを作成</li>
                  <li>2. 「新しいタブで開く」を選択</li>
                  <li>3. 新しいタブでStripeページが正常に表示されることを確認</li>
                  <li>4. 決済情報入力画面が表示されれば成功</li>
                </ol>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
