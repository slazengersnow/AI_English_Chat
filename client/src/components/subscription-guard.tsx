import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard } from "lucide-react";
import { UserSubscription } from "@shared/schema";
import { useAuth } from "@/components/auth-provider";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const [, setLocation] = useLocation();
  const { isAdmin, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Only query subscription if user is authenticated
  const { data: subscription, isLoading: subscriptionLoading, error } = useQuery<UserSubscription>({
    queryKey: ["/api/user-subscription"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Admin users bypass subscription checks
  if (isAdmin) {
    return <>{children}</>;
  }

  // Wait for auth to load
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // If not authenticated, don't render anything (App.tsx router will handle redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Wait for subscription to load
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Handle subscription status
  if (subscription && ['active', 'trialing'].includes(subscription.subscriptionStatus || '')) {
    console.log('SubscriptionGuard - Valid subscription, allowing access');
    return <>{children}</>;
  }

  // If no valid subscription, show subscription required screen
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Lock className="w-12 h-12 mx-auto text-orange-500 mb-4" />
          <CardTitle>サブスクリプションが必要です</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            AI瞬間英作文チャットをご利用いただくには、アクティブなサブスクリプションが必要です。
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => setLocation('/subscription/select')}
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              プランを選択
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}