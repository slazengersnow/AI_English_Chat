import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PremiumGateProps {
  children: ReactNode;
  feature?: string;
  showUpgrade?: boolean;
}

export function PremiumGate({ children, feature = "この機能", showUpgrade = true }: PremiumGateProps) {
  const { canAccessPremiumFeatures, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!canAccessPremiumFeatures) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">プレミアム機能</CardTitle>
              <CardDescription className="text-base">
                {feature}はプレミアムプラン限定です。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
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
              
              {showUpgrade && (
                <div className="space-y-4">
                  <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3">
                    <Crown className="w-4 h-4 mr-2" />
                    プレミアムプランにアップグレード
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
                    戻る
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}