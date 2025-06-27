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
    priceId: "prod_SZgeMcEAMDMlDe",
    name: "スタンダード",
    price: "1,980",
    period: "月",
    features: [
      "1日100問まで",
      "基本的な評価機能",
      "進捗記録",
      "ブックマーク機能"
    ]
  },
  {
    priceId: "prod_SZglW626p1IFsh",
    name: "スタンダード",
    price: "19,800",
    period: "年",
    features: [
      "1日100問まで",
      "基本的な評価機能", 
      "進捗記録",
      "ブックマーク機能"
    ],
    savings: "2ヶ月分お得"
  },
  {
    priceId: "prod_SZgm74ZfQCQMSP",
    name: "プレミアム",
    price: "3,980",
    period: "月",
    features: [
      "無制限問題",
      "カスタムシナリオ作成",
      "詳細な分析機能",
      "復習機能",
      "優先サポート"
    ],
    popular: true
  },
  {
    priceId: "prod_SZgnjreCBit2Bj",
    name: "プレミアム",
    price: "39,800",
    period: "年",
    features: [
      "無制限問題",
      "カスタムシナリオ作成",
      "詳細な分析機能",
      "復習機能",
      "優先サポート"
    ],
    savings: "2ヶ月分お得"
  }
];

export default function SubscriptionSelect() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const createCheckoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/create-checkout-session", { priceId });
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "決済画面の作成に失敗しました",
        variant: "destructive"
      });
    }
  });

  const handlePlanSelect = (priceId: string) => {
    setSelectedPlan(priceId);
    createCheckoutMutation.mutate(priceId);
  };

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
          <p className="text-sm text-gray-600 mb-4">
            ※ 7日間のトライアル期間中はいつでもキャンセル可能です
          </p>
          <p className="text-xs text-gray-500">
            ご利用には
            <a href="/terms" className="text-blue-600 hover:underline mx-1">
              利用規約
            </a>
            への同意が必要です
          </p>
        </div>
      </div>
    </div>
  );
}