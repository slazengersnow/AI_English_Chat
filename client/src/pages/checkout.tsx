import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Stripe公開キーの設定
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  console.error('Missing VITE_STRIPE_PUBLIC_KEY environment variable');
}
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const CheckoutForm = ({ planId }: { planId: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const planDetails = {
    'standard': { name: 'スタンダード', price: '¥980/月' },
    'premium': { name: 'プレミアム', price: '¥1,300/月' },
    'standard-yearly': { name: 'スタンダード年間', price: '¥9,800/年' },
    'premium-yearly': { name: 'プレミアム年間', price: '¥13,000/年' }
  };

  const plan = planDetails[planId as keyof typeof planDetails] || planDetails.standard;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?plan=${planId}`,
        },
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "決済エラー",
          description: error.message || "決済処理中にエラーが発生しました",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "決済エラー",
        description: "決済処理中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {plan.name}プランの決済
        </CardTitle>
        <p className="text-center text-gray-600">{plan.price}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          
          <Button
            type="submit"
            disabled={!stripe || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? '処理中...' : '決済を完了する'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('plan') || 'standard';
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        // プランIDに基づいて金額を決定（テスト用の少額に設定）
        const amounts = {
          'standard': 100, // ¥1 (テスト用)
          'premium': 200, // ¥2 (テスト用)  
          'standard-yearly': 500, // ¥5 (テスト用)
          'premium-yearly': 700 // ¥7 (テスト用)
        };
        
        const amount = amounts[planId as keyof typeof amounts] || 100;

        const data = await apiRequest("/api/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            planId,
            currency: 'jpy'
          })
        });
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        navigate('/subscription-select');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [planId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            <span className="ml-3">決済情報を準備中...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">
              {!stripePromise ? 'Stripe設定が不足しています' : '決済情報の作成に失敗しました'}
            </p>
            <Button onClick={() => navigate('/subscription-select')}>
              プラン選択に戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm planId={planId} />
      </Elements>
    </div>
  );
}