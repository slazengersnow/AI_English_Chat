import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlan {
  priceId: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  savings?: string;
}

const plans: SubscriptionPlan[] = [
  {
    priceId: "price_1ReXPnHridtc6DvMQaW7NC6w",
    name: "スタンダード",
    price: "980",
    period: "月",
    features: [
      "月額980円",
      "基本練習機能（全レベル対応）",
      "1日100問まで",
      "基本的な進捗管理",
      "基本サポート"
    ]
  },
  {
    priceId: "price_1ReXPnHridtc6DvMQaW7NC6w",
    name: "プレミアム",
    price: "1,300",
    period: "月",
    features: [
      "月額1,300円",
      "基本練習機能（全レベル対応）",
      "無制限問題",
      "カスタムシナリオ作成",
      "詳細な分析機能",
      "復習機能",
      "優先サポート"
    ],
    popular: true
  },
  {
    priceId: "price_1ReXPnHridtc6DvMQaW7NC6w",
    name: "スタンダード年間",
    price: "9,800",
    period: "年",
    features: [
      "年会費9,800円（2ヶ月無料）",
      "基本練習機能（全レベル対応）",
      "1日100問まで",
      "基本的な進捗管理",
      "基本サポート"
    ],
    savings: "月額比較で2ヶ月分お得"
  },
  {
    priceId: "price_1ReXPnHridtc6DvMQaW7NC6w",
    name: "プレミアム年間",
    price: "13,000",
    period: "年",
    features: [
      "年会費13,000円（2ヶ月無料）",
      "基本練習機能（全レベル対応）",
      "無制限問題",
      "カスタムシナリオ作成",
      "詳細な分析機能",
      "復習機能",
      "優先サポート"
    ],
    savings: "月額比較で2ヶ月分お得"
  }
];

export default function SubscriptionSelect() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [checkoutOpened, setCheckoutOpened] = useState(false);
  const { toast } = useToast();

  const createCheckoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const origin = window.location.origin;
      const response = await apiRequest("POST", "/api/create-checkout-session", { 
        priceId,
        successUrl: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/payment-cancelled`
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Checkout session created:', data);
      // 新しいタブでチェックアウトページを開く（推奨）
      const newWindow = window.open(data.url, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        // ポップアップがブロックされた場合は現在のウィンドウで開く
        window.location.href = data.url;
      } else {
        // 新しいタブで開いた場合は確認画面を表示
        setCheckoutOpened(true);
      }
    },
    onError: (error) => {
      console.error('Checkout error:', error);
      toast({
        title: "エラー",
        description: "決済画面の作成に失敗しました。ページを再読み込みして再度お試しください。",
        variant: "destructive"
      });
    }
  });

  const handlePlanSelect = (priceId: string) => {
    setSelectedPlan(priceId);
    createCheckoutMutation.mutate(priceId);
  };

  // Show checkout opened confirmation
  if (checkoutOpened) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl max-w-lg w-full p-8 text-center shadow-xl">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              決済画面を開きました
            </h2>
            <p className="text-gray-600 mb-6">
              新しいタブでStripe決済画面が開きました。<br />
              決済を完了してこちらのページにお戻りください。
            </p>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2 font-semibold">
                決済完了後の流れ：
              </p>
              <p className="text-sm text-blue-700">
                決済が完了すると自動的に成功ページに移動し、<br />
                すぐにプレミアム機能をご利用いただけます。
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 mb-2 font-semibold">
                新しいタブが開かない場合：
              </p>
              <p className="text-sm text-yellow-700">
                ブラウザのポップアップブロックが有効になっている可能性があります。<br />
                ポップアップを許可してから再度お試しください。
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setCheckoutOpened(false)}
              variant="outline"
              className="flex-1"
            >
              プラン選択に戻る
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              トップページに戻る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            プランを選択してください
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI英作文チャットで英語力を向上させましょう
          </p>
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
            <Star className="w-4 h-4" />
            <span className="font-medium">7日間無料トライアル</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg ${
                plan.popular ? 'ring-2 ring-purple-500' : ''
              } ${
                selectedPlan === plan.priceId ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handlePlanSelect(plan.priceId)}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
                  人気
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {plan.name === "プレミアム" ? (
                    <Crown className="w-6 h-6 text-purple-600 mr-2" />
                  ) : (
                    <Star className="w-6 h-6 text-blue-600 mr-2" />
                  )}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                
                <div className="text-center">
                  <span className="text-3xl font-bold">¥{plan.price.toLocaleString()}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
                
                {plan.savings && (
                  <Badge variant="outline" className="mt-2">
                    {plan.savings}
                  </Badge>
                )}
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  disabled={createCheckoutMutation.isPending && selectedPlan === plan.priceId}
                >
                  {createCheckoutMutation.isPending && selectedPlan === plan.priceId
                    ? "処理中..." 
                    : "7日間無料で開始"
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-semibold mb-2">⚠️ 価格ID設定について</p>
            <p className="text-yellow-700 text-sm mb-2">
              現在の価格IDは¥13,000として設定されています。正しい¥1,300の価格IDを作成するか、既存の正しい価格IDを使用する必要があります。
            </p>
            <div className="space-y-2">
              <a href="/plan-configuration" className="text-blue-600 hover:underline text-sm font-semibold">
                プラン価格ID設定
              </a>
              <span className="text-gray-400 mx-2">•</span>
              <a href="/stripe-price-check" className="text-blue-600 hover:underline text-sm">
                価格ID確認ツール
              </a>
              <span className="text-gray-400 mx-2">•</span>
              <a href="/stripe-checkout-debug" className="text-blue-600 hover:underline text-sm">
                決済診断ツール
              </a>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            ※ 7日間のトライアル期間中はいつでもキャンセル可能です
          </p>
          <p className="text-xs text-gray-500 mb-4">
            ご利用には
            <a href="/terms" className="text-blue-600 hover:underline mx-1">
              利用規約
            </a>
            への同意が必要です
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="text-blue-800 font-semibold mb-2">決済画面について</p>
            <p className="text-blue-700">
              決済画面は新しいタブで開きます。ポップアップがブロックされている場合は、
              <a href="/stripe-checkout-debug" className="text-blue-600 hover:underline mx-1">
                こちらの診断ページ
              </a>
              をご利用ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}