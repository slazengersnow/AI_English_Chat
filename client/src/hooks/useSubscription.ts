import { useQuery } from "@tanstack/react-query";

interface UserSubscription {
  subscriptionType: "standard" | "premium";
  isAdmin: boolean;
  userId: string;
}

export function useSubscription() {
  const { data: subscription, isLoading } = useQuery<UserSubscription>({
    queryKey: ["/api/user-subscription"],
  });

  const canAccessPremiumFeatures = subscription?.subscriptionType === "premium" || subscription?.isAdmin;

  return {
    subscription,
    isLoading,
    canAccessPremiumFeatures,
    isAdmin: subscription?.isAdmin || false,
    subscriptionType: subscription?.subscriptionType || "standard",
  };
}