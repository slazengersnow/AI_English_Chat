"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSubscription = useSubscription;
const react_query_1 = require("@tanstack/react-query");
function useSubscription() {
    const { data: subscription, isLoading } = (0, react_query_1.useQuery)({
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
