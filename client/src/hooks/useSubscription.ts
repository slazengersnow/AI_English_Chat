import { useQuery } from "@tanstack/react-query";

interface UserSubscription {
  subscriptionType: "standard" | "premium";
  isAdmin: boolean;
  userId: string;
}

export function useSubscription() {
  const { data: subscription, isLoading } = useQuery<UserSubscription>({
    queryKey: ["/api/user-subscription"],
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
  });

  // For testing purposes: if subscription is explicitly set to "standard", show standard experience even for admins
  const canAccessPremiumFeatures = subscription?.subscriptionType === "premium";

  return {
    subscription,
    isLoading,
    canAccessPremiumFeatures,
    isAdmin: subscription?.isAdmin || false,
    subscriptionType: subscription?.subscriptionType || "standard",
  };
}