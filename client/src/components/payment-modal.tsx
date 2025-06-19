import { Button } from "@/components/ui/button";
import { X, Check, Crown } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CheckoutSessionResponse } from "@shared/schema";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const createCheckoutSessionMutation = useMutation({
    mutationFn: async (): Promise<CheckoutSessionResponse> => {
      const response = await apiRequest("POST", "/api/create-checkout-session", {
        priceId: "price_placeholder", // This would be your actual Stripe price ID
        successUrl: window.location.origin + "/success",
        cancelUrl: window.location.origin + "/cancel",
      });
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 animate-bounce-in">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Crown className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900">プレミアム</h3>
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

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 text-sm">
            AIによる詳細な添削とフィードバックで、英作文スキルを効率的に向上させましょう。
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">無制限の練習問題</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">詳細な添削フィードバック</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">進捗レポート機能</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">すべての難易度レベル</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">¥980</div>
            <div className="text-sm text-gray-600">月額</div>
            <div className="text-xs text-purple-600 mt-1">7日間無料トライアル</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => createCheckoutSessionMutation.mutate()}
            disabled={createCheckoutSessionMutation.isPending}
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
          
          <Button 
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
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