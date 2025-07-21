import { Button } from "@/components/ui/button";
import { X, Check, Crown, Star } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import type { CheckoutSessionResponse } from "@shared/schema";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SubscriptionPlan {
  priceId: string;
  name: string;
  price: string;
  features: string[];
}

interface SubscriptionPlans {
  standard_monthly: SubscriptionPlan;
  standard_yearly: SubscriptionPlan;
  premium_monthly: SubscriptionPlan;
  premium_yearly: SubscriptionPlan;
  upgrade_to_premium: SubscriptionPlan;
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>("premium_monthly");
  const [checkoutOpened, setCheckoutOpened] = useState(false);

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/subscription-plans"],
    enabled: isOpen,
  });

  const createCheckoutSessionMutation = useMutation({
    mutationFn: async (priceId: string): Promise<CheckoutSessionResponse> => {
      const response = await apiRequest(
        "POST",
        "/api/create-checkout-session",
        {
          priceId,
          successUrl: window.location.origin + "/success",
          cancelUrl: window.location.origin + "/cancel",
        },
      );
      return response.json();
    },
    onSuccess: (data) => {
      // Open Stripe Checkout in new tab
      window.open(data.url, "_blank");
      setCheckoutOpened(true);
    },
  });

  const handleUpgrade = () => {
    if (plans && selectedPlan) {
      const plan = (plans as SubscriptionPlans)[
        selectedPlan as keyof SubscriptionPlans
      ];
      if (plan) {
        createCheckoutSessionMutation.mutate(plan.priceId);
      }
    }
  };

  if (!isOpen) return null;

  if (plansLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">プランを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  const plansData = plans as SubscriptionPlans;
  const selectedPlanData = plansData?.[selectedPlan as keyof SubscriptionPlans];

  // Show checkout opened confirmation
  if (checkoutOpened) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              決済画面を開きました
            </h2>
            <p className="text-gray-600 mb-4">
              新しいタブでStripe決済画面が開きました。
              <br />
              決済を完了してこちらのページにお戻りください。
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 mb-1">
                <strong>決済完了後の流れ：</strong>
              </p>
              <p className="text-sm text-blue-700">
                決済が完了すると自動的にこちらのページに戻り、
                <br />
                すぐにプレミアム機能をご利用いただけます。
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-1">
                <strong>新しいタブが開かない場合：</strong>
              </p>
              <p className="text-sm text-gray-500">
                ブラウザのポップアップブロックを解除してから
                <br />
                再度お試しください。
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => setCheckoutOpened(false)}
              variant="outline"
              className="flex-1"
            >
              戻る
            </Button>
            <Button onClick={onClose} className="flex-1">
              閉じる
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-bounce-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Crown className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900">
              プレミアムプラン
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Plan Selection */}
        <div className="space-y-3 mb-6">
          {plansData &&
            Object.entries(plansData).map(([key, plan]) => {
              const isPremium = key.includes("premium");
              const isYearly = key.includes("yearly");
              const isUpgrade = key.includes("upgrade");

              if (isUpgrade) return null; // Hide upgrade option for now

              return (
                <div
                  key={key}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPlan === key
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedPlan(key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPlan === key
                            ? "border-purple-600 bg-purple-600"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedPlan === key && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          {isPremium ? (
                            <Crown className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Star className="w-4 h-4 text-blue-600" />
                          )}
                          <h4 className="font-semibold text-gray-900">
                            {plan.name}
                          </h4>
                          {isYearly && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              お得
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{plan.price}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pl-8">
                    <ul className="text-sm text-gray-600 space-y-1">
                      {plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Check className="w-3 h-3 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="text-center mb-6">
          <p className="text-gray-600 text-sm">
            選択したプランでAI英作文学習を始めましょう
          </p>
          {selectedPlanData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-2">
                選択中のプラン
              </h4>
              <p className="text-lg font-bold text-purple-600">
                {selectedPlanData.name}
              </p>
              <p className="text-sm text-gray-600">{selectedPlanData.price}</p>
              <div className="text-xs text-purple-600 mt-2">
                7日間無料トライアル付き
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleUpgrade}
            disabled={
              createCheckoutSessionMutation.isPending || !selectedPlanData
            }
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-medium"
          >
            {createCheckoutSessionMutation.isPending ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>処理中...</span>
              </div>
            ) : (
              "7日間無料で始める"
            )}
          </Button>

          <Button onClick={onClose} variant="outline" className="w-full">
            後で検討する
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          トライアル期間中はいつでもキャンセル可能です。
        </p>
      </div>
    </div>
  );
}
