import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard } from "lucide-react";
import { UserSubscription } from "@shared/schema";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const [, setLocation] = useLocation();
  
  const { data: subscription, isLoading, error } = useQuery<UserSubscription>({
    queryKey: ["/api/user-subscription"],
    retry: false,
  });

  useEffect(() => {
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
    } else if (!isLoading && !subscription) {
      // If no subscription at all, redirect to subscription selection
      if (window.location.pathname !== '/subscription/select' && 
          window.location.pathname !== '/login' && 
          window.location.pathname !== '/signup' &&
          window.location.pathname !== '/terms') {
        console.log('SubscriptionGuard - No subscription, redirecting to subscription select');
        setLocation('/subscription/select');
      }
    }
  }, [subscription, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || (!subscription || !['active', 'trialing'].includes(subscription.subscriptionStatus || ''))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 mx-auto text-orange-500 mb-4" />
            <CardTitle>サブスクリプションが必要です</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              AI英作文チャットをご利用いただくには、アクティブなサブスクリプションが必要です。
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => setLocation('/subscription/select')}
                className="w-full"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                プランを選択
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/login')}
                className="w-full"
              >
                ログイン
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}