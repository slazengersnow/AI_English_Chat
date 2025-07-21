import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { SubscriptionGuard } from "@/components/subscription-guard";
import Home from "@/pages/home";
import MyPage from "@/pages/my-page";
import SimulationSelection from "@/pages/simulation-selection";
import SimulationPractice from "@/pages/simulation-practice";
import Admin from "@/pages/admin";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Confirm from "@/pages/confirm";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import SubscriptionSelect from "@/pages/subscription-select";
import AuthCallback from "@/pages/auth-callback";
import DebugAuth from "@/pages/debug-auth";
import AdminSetup from "@/pages/admin-setup";
import PasswordReset from "@/pages/password-reset";
import ResetPassword from "@/pages/reset-password";
import RedirectHandler from "@/pages/redirect-handler";
import { HashHandler } from "@/components/hash-handler";
import TestHash from "@/pages/test-hash";
import AuthRedirect from "@/pages/auth-redirect";
import DebugEmail from "@/pages/debug-email";
import ComprehensiveDebug from "@/pages/comprehensive-debug";
import EmailTest from "@/pages/email-test";
import SupabaseConfigCheck from "@/pages/supabase-config-check";
import FixEmail from "@/pages/fix-email";
import DirectAccess from "@/pages/direct-access";
import TestActualLink from "@/pages/test-actual-link";
import StripeTest from "@/pages/stripe-test";
import PriceCheck from "@/pages/price-check";
import PaymentSuccess from "@/pages/payment-success";
import PaymentCancelled from "@/pages/payment-cancelled";
import DebugPayment from "@/pages/debug-payment";
import StripeCheckoutDebug from "@/pages/stripe-checkout-debug";
import StripePriceCheck from "@/pages/stripe-price-check";
import PlanConfiguration from "@/pages/plan-configuration";
import SimplePriceSetup from "@/pages/simple-price-setup";
import NotFound from "@/pages/not-found";
import Logout from "@/pages/logout";
// Protected routes that require active subscription
function ProtectedRoute({ component: Component }) {
    return (_jsx(SubscriptionGuard, { children: _jsx(Component, {}) }));
}
function Router() {
    const { isAuthenticated, isLoading } = useAuth();
    const [, setLocation] = useLocation();
    // Let HashHandler component handle all hash fragment processing
    useEffect(() => {
        const currentPath = window.location.pathname;
        const hash = window.location.hash;
        console.log('Router - Current path:', currentPath);
        console.log('Router - Hash:', hash);
        console.log('Router - Initialized');
        // If not authenticated and on protected route, redirect to login
        if (!isLoading && !isAuthenticated && currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/terms' && currentPath !== '/privacy') {
            console.log('Router - Not authenticated, redirecting to login');
            setLocation('/login');
        }
    }, [isAuthenticated, isLoading, setLocation]);
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" }) }));
    }
    return (_jsxs(Switch, { children: [_jsx(Route, { path: "/login", component: Login }), _jsx(Route, { path: "/signup", component: Signup }), _jsx(Route, { path: "/confirm", component: Confirm }), _jsx(Route, { path: "/auth/callback", component: AuthCallback }), _jsx(Route, { path: "/debug-auth", component: DebugAuth }), _jsx(Route, { path: "/admin-setup", component: AdminSetup }), _jsx(Route, { path: "/password-reset", component: PasswordReset }), _jsx(Route, { path: "/reset-password", component: ResetPassword }), _jsx(Route, { path: "/redirect-handler", component: RedirectHandler }), _jsx(Route, { path: "/auth-redirect", component: AuthRedirect }), _jsx(Route, { path: "/test-hash", component: TestHash }), _jsx(Route, { path: "/debug-email", component: DebugEmail }), _jsx(Route, { path: "/comprehensive-debug", component: ComprehensiveDebug }), _jsx(Route, { path: "/email-test", component: EmailTest }), _jsx(Route, { path: "/supabase-config-check", component: SupabaseConfigCheck }), _jsx(Route, { path: "/fix-email", component: FixEmail }), _jsx(Route, { path: "/direct-access", component: DirectAccess }), _jsx(Route, { path: "/auth-callback", component: AuthCallback }), _jsx(Route, { path: "/auth/callback", component: AuthCallback }), _jsx(Route, { path: "/test-actual-link", component: TestActualLink }), _jsx(Route, { path: "/stripe-test", component: StripeTest }), _jsx(Route, { path: "/price-check", component: PriceCheck }), _jsx(Route, { path: "/debug-payment", component: DebugPayment }), _jsx(Route, { path: "/stripe-checkout-debug", component: StripeCheckoutDebug }), _jsx(Route, { path: "/stripe-price-check", component: StripePriceCheck }), _jsx(Route, { path: "/plan-configuration", component: PlanConfiguration }), _jsx(Route, { path: "/price-setup", component: SimplePriceSetup }), _jsx(Route, { path: "/payment-success", component: PaymentSuccess }), _jsx(Route, { path: "/payment-cancelled", component: PaymentCancelled }), _jsx(Route, { path: "/success", component: PaymentSuccess }), _jsx(Route, { path: "/cancel", component: PaymentCancelled }), _jsx(Route, { path: "/terms", component: Terms }), _jsx(Route, { path: "/privacy", component: Privacy }), _jsx(Route, { path: "/logout", component: Logout }), isAuthenticated ? (_jsxs(_Fragment, { children: [_jsx(Route, { path: "/", component: () => _jsx(ProtectedRoute, { component: Home }) }), _jsx(Route, { path: "/my-page", component: () => _jsx(ProtectedRoute, { component: MyPage }) }), _jsx(Route, { path: "/simulation", component: () => _jsx(ProtectedRoute, { component: SimulationSelection }) }), _jsx(Route, { path: "/simulation/:id", component: () => _jsx(ProtectedRoute, { component: SimulationPractice }) }), _jsx(Route, { path: "/simulation-practice", component: () => _jsx(ProtectedRoute, { component: SimulationPractice }) }), _jsx(Route, { path: "/admin", component: () => _jsx(ProtectedRoute, { component: Admin }) }), _jsx(Route, { path: "/chat/:difficulty", component: () => _jsx(ProtectedRoute, { component: Home }) }), _jsx(Route, { path: "/practice/:difficulty", component: () => _jsx(ProtectedRoute, { component: Home }) }), _jsx(Route, { path: "/subscription/select", component: SubscriptionSelect }), _jsx(Route, { path: "/payment-success", component: PaymentSuccess }), _jsx(Route, { path: "/payment-cancelled", component: PaymentCancelled }), _jsx(Route, { path: "/success", component: PaymentSuccess }), _jsx(Route, { path: "/cancel", component: PaymentCancelled })] })) : (_jsx(_Fragment, { children: _jsx(Route, { path: "/", component: Login }) })), _jsx(Route, { component: NotFound })] }));
}
function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(AuthProvider, { children: _jsxs(TooltipProvider, { children: [_jsx(Toaster, {}), _jsx(HashHandler, {}), _jsx(Router, {})] }) }) }));
}
export default App;
