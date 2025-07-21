import { useQuery } from "@tanstack/react-query";
export function useSubscription() {
    const { data: subscription, isLoading } = useQuery({
        queryKey: ["/api/user-subscription"],
        staleTime: 0, // Always consider data stale
        gcTime: 0, // Don't cache data
    });
    // Only premium users can access premium features
    // Trial users can only access features of their plan type
    const canAccessPremiumFeatures = subscription?.subscriptionType === "premium" &&
        (subscription?.subscriptionStatus === "active" || subscription?.subscriptionStatus === "trialing");
    return {
        subscription,
        isLoading,
        canAccessPremiumFeatures,
        isAdmin: subscription?.isAdmin || false,
        subscriptionType: subscription?.subscriptionType || "standard",
    };
}
