"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PremiumGate = PremiumGate;
const useSubscription_1 = require("@/hooks/useSubscription");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
function PremiumGate({ children, feature = "この機能", showUpgrade = true }) {
    const { canAccessPremiumFeatures, isLoading } = (0, useSubscription_1.useSubscription)();
    if (isLoading) {
        return (<div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
      </div>);
    }
    if (!canAccessPremiumFeatures) {
        return (<div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <card_1.Card className="text-center">
            <card_1.CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <lucide_react_1.Crown className="w-8 h-8 text-white"/>
                </div>
              </div>
              <card_1.CardTitle className="text-2xl mb-2">プレミアム機能</card_1.CardTitle>
              <card_1.CardDescription className="text-base">
                {feature}はプレミアムプラン限定です。
              </card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <lucide_react_1.Lock className="w-5 h-5 text-blue-600 mt-0.5"/>
                  <div className="text-left">
                    <p className="text-blue-900 font-medium mb-2">
                      この機能はプレミアムプラン限定です。
                    </p>
                    <p className="text-blue-800 text-sm">
                      リアルなビジネスシーンを想定したシミュレーション練習を体験したい方は、プレミアムプランをご検討ください。
                    </p>
                  </div>
                </div>
              </div>
              
              {showUpgrade && (<div className="space-y-4">
                  <button_1.Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3">
                    <lucide_react_1.Crown className="w-4 h-4 mr-2"/>
                    プレミアムプランにアップグレード
                  </button_1.Button>
                  <button_1.Button variant="outline" className="w-full" onClick={() => window.history.back()}>
                    戻る
                  </button_1.Button>
                </div>)}
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>);
    }
    return <>{children}</>;
}
