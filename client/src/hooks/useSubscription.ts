import { useQuery } from "@tanstack/react-query";

interface UserSubscription {
  id: number;
  userId: string;
  subscriptionType: "standard" | "premium" | "trialing";
  subscriptionStatus: string;
  planName?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  validUntil?: Date;
  trialStart?: Date;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function useSubscription() {
  const { data: subscription, isLoading } = useQuery<UserSubscription>({
    queryKey: ["/api/user-subscription"],
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
  });

  // Trial users and premium users can access premium features
  const canAccessPremiumFeatures = subscription?.subscriptionType === "premium" || subscription?.subscriptionStatus === "trialing";

  return {
    subscription,
    isLoading,
    canAccessPremiumFeatures,
    isAdmin: subscription?.isAdmin || false,
    subscriptionType: subscription?.subscriptionType || "standard",
  };
}