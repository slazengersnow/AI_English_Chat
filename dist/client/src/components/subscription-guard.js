"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionGuard = SubscriptionGuard;
const react_query_1 = require("@tanstack/react-query");
const wouter_1 = require("wouter");
const react_1 = require("react");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const auth_provider_1 = require("@/components/auth-provider");
function SubscriptionGuard({ children }) {
    const [, setLocation] = (0, wouter_1.useLocation)();
    const { isAdmin } = (0, auth_provider_1.useAuth)();
    const { data: subscription, isLoading, error } = (0, react_query_1.useQuery)({
        queryKey: ["/api/user-subscription"],
        retry: false,
    });
    // Admin users bypass subscription checks
    if (isAdmin) {
        return <>{children}</>;
    }
    (0, react_1.useEffect)(() => {
        if (!isLoading && subscription) {
            console.log('SubscriptionGuard - Subscription data:', subscription);
            console.log('SubscriptionGuard - Status:', subscription.subscriptionStatus);
            if (!['active', 'trialing'].includes(subscription.subscriptionStatus || '')) {
                // If no subscription or inactive, redirect to subscription selection
                if (window.location.pathname !== '/subscription/select' &&
                    window.location.pathname !== '/login' &&
                    window.location.pathname !== '/signup' &&
                    window.location.pathname !== '/terms') {
                    console.log('SubscriptionGuard - Redirecting to subscription select');
                    setLocation('/subscription/select');
                }
            }
        }
        else if (!isLoading && !subscription) {
            // If no subscription at all, redirect to login instead of subscription selection
            if (window.location.pathname !== '/subscription/select' &&
                window.location.pathname !== '/login' &&
                window.location.pathname !== '/signup' &&
                window.location.pathname !== '/terms') {
                console.log('SubscriptionGuard - No subscription, redirecting to login');
                setLocation('/login');
            }
        }
    }, [subscription, isLoading, setLocation]);
    if (isLoading) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"/>
      </div>);
    }
    if (error || (!subscription || !['active', 'trialing'].includes(subscription.subscriptionStatus || ''))) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <card_1.Card className="w-full max-w-md">
          <card_1.CardHeader className="text-center">
            <lucide_react_1.Lock className="w-12 h-12 mx-auto text-orange-500 mb-4"/>
            <card_1.CardTitle>サブスクリプションが必要です</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              AI英作文チャットをご利用いただくには、アクティブなサブスクリプションが必要です。
            </p>
            <div className="space-y-2">
              <button_1.Button variant="outline" onClick={() => setLocation('/login')} className="w-full">
                ログイン
              </button_1.Button>
              <button_1.Button onClick={() => setLocation('/subscription/select')} className="w-full">
                <lucide_react_1.CreditCard className="w-4 h-4 mr-2"/>
                プランを選択
              </button_1.Button>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>);
    }
    return <>{children}</>;
}
