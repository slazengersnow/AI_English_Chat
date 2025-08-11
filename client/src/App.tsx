import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster.js";
import { TooltipProvider } from "./components/ui/tooltip.js";
import { AuthProvider, useAuth } from "./components/auth-provider.js";
import { SubscriptionGuard } from "./components/subscription-guard.js";
import Home from "./pages/home.js";
import MyPage from "./pages/my-page.js";
import SimulationSelection from "./pages/simulation-selection.js";
import SimulationPractice from "./pages/simulation-practice.js";
import Admin from "./pages/admin.js";
import Success from "./pages/success.js";
import Cancel from "./pages/cancel.js";
import Login from "./pages/login.js";
import LoginTest from "./pages/login-test.js";
import Signup from "./pages/signup.js";
import SignupSimple from "./pages/signup-simple.js";
import Confirm from "./pages/confirm.js";
import Terms from "./pages/terms.js";
import Privacy from "./pages/privacy.js";
import SubscriptionSelect from "./pages/subscription-select.js";
import AuthCallback from "./pages/auth-callback.js";
import DebugAuth from "./pages/debug-auth.js";
import AdminSetup from "./pages/admin-setup.js";
import PasswordReset from "./pages/password-reset.js";
import ResetPassword from "./pages/reset-password.js";
import RedirectHandler from "./pages/redirect-handler.js";
import { HashHandler } from "./components/hash-handler.js";
import TestHash from "./pages/test-hash.js";
import AuthRedirect from "./pages/auth-redirect.js";
import DebugEmail from "./pages/debug-email.js";
import ComprehensiveDebug from "./pages/comprehensive-debug.js";
import EmailTest from "./pages/email-test.js";
import SupabaseConfigCheck from "./pages/supabase-config-check.js";
import FixEmail from "./pages/fix-email.js";
import DirectAccess from "./pages/direct-access.js";
import TestActualLink from "./pages/test-actual-link.js";
import StripeTest from "./pages/stripe-test.js";
import PriceCheck from "./pages/price-check.js";
import PaymentSuccess from "./pages/payment-success.js";
import PaymentCancelled from "./pages/payment-cancelled.js";
import DebugPayment from "./pages/debug-payment.js";
import StripeCheckoutDebug from "./pages/stripe-checkout-debug.js";
import StripePriceCheck from "./pages/stripe-price-check.js";
import PlanConfiguration from "./pages/plan-configuration.js";
import SimplePriceSetup from "./pages/simple-price-setup.js";
import DebugPage from "./pages/debug.js";
import SimpleLogin from "./pages/simple-login.js";
import CreateAdmin from "./pages/create-admin.js";
import NotFound from "./pages/not-found.js";
import Logout from "./pages/logout.js";
import OAuthFix from "./pages/oauth-fix.js";
import EmergencyLogin from "./pages/emergency-login.js";
import WorkingLogin from "./pages/working-login.js";
import FinalAuthTest from "./pages/final-auth-test.js";
import ReplitAuthFix from "./pages/replit-auth-fix.js";
import EmergencyAuthFix from "./pages/emergency-auth-fix.js";
import SignupSimple from "./pages/signup-simple.js";

// Protected routes that require active subscription
function ProtectedRoute({ component: Component }: { component: any }) {
  return (
    <SubscriptionGuard>
      <Component />
    </SubscriptionGuard>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Authentication enforcement with loading state protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      const publicPaths = [
        "/login",
        "/signup",
        "/signup-simple",
        "/confirm",
        "/auth/callback",
        "/terms",
        "/privacy",
        "/debug-auth",
        "/debug",
        "/login-test",
        "/create-admin",
        "/admin-setup",
        "/password-reset",
        "/reset-password",
        "/simple-login",
      ];

      if (!publicPaths.includes(currentPath)) {
        console.log(
          "Router - Unauthorized access, redirecting to login after delay",
        );
        // Add small delay to prevent flash during authentication state changes
        const timer = setTimeout(() => {
          setLocation("/login");
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Strict authentication - no bypass
  const forceMainApp = false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/create-admin" component={CreateAdmin} />
      <Route path="/login-test" component={LoginTest} />
      <Route path="/signup" component={Signup} />
      <Route path="/signup-simple" component={SignupSimple} />
      <Route path="/confirm" component={Confirm} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/debug-auth" component={DebugAuth} />
      <Route path="/debug" component={DebugPage} />
      <Route path="/simple-login" component={SimpleLogin} />
      <Route path="/create-admin" component={CreateAdmin} />
      <Route path="/admin-setup" component={AdminSetup} />
      <Route path="/password-reset" component={PasswordReset} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/redirect-handler" component={RedirectHandler} />
      <Route path="/auth-redirect" component={AuthRedirect} />
      <Route path="/test-hash" component={TestHash} />
      <Route path="/debug-email" component={DebugEmail} />
      <Route path="/comprehensive-debug" component={ComprehensiveDebug} />
      <Route path="/email-test" component={EmailTest} />
      <Route path="/supabase-config-check" component={SupabaseConfigCheck} />
      <Route path="/fix-email" component={FixEmail} />
      <Route path="/direct-access" component={DirectAccess} />
      <Route path="/auth-callback" component={AuthCallback} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/confirm" component={AuthCallback} />
      <Route path="/test-actual-link" component={TestActualLink} />
      <Route path="/stripe-test" component={StripeTest} />
      <Route path="/price-check" component={PriceCheck} />
      <Route path="/debug-payment" component={DebugPayment} />
      <Route path="/stripe-checkout-debug" component={StripeCheckoutDebug} />
      <Route path="/stripe-price-check" component={StripePriceCheck} />
      <Route path="/plan-configuration" component={PlanConfiguration} />
      <Route path="/price-setup" component={SimplePriceSetup} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/payment-cancelled" component={PaymentCancelled} />
      <Route path="/success" component={PaymentSuccess} />
      <Route path="/cancel" component={PaymentCancelled} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/logout" component={Logout} />
      <Route path="/oauth-fix" component={OAuthFix} />
      <Route path="/emergency-login" component={EmergencyLogin} />
      <Route path="/working-login" component={WorkingLogin} />
      <Route path="/final-auth-test" component={FinalAuthTest} />
      <Route path="/replit-auth-fix" component={ReplitAuthFix} />
      <Route path="/emergency-auth-fix" component={EmergencyAuthFix} />
      {/* <Route path="/auth" component={() => import('./pages/AuthPage.js').then(m => m.AuthPage)} /> */}

      {isAuthenticated || forceMainApp ? (
        <>
          {/* Protected routes for authenticated users */}
          <Route path="/" component={Home} />
          <Route
            path="/my-page"
            component={() => <ProtectedRoute component={MyPage} />}
          />
          <Route
            path="/simulation"
            component={() => <ProtectedRoute component={SimulationSelection} />}
          />
          <Route
            path="/simulation/:id"
            component={() => <ProtectedRoute component={SimulationPractice} />}
          />
          <Route
            path="/simulation-practice"
            component={() => <ProtectedRoute component={SimulationPractice} />}
          />
          <Route
            path="/admin"
            component={() => <ProtectedRoute component={Admin} />}
          />
          <Route
            path="/chat/:difficulty"
            component={() => <ProtectedRoute component={Home} />}
          />
          <Route
            path="/practice/:difficulty"
            component={() => <ProtectedRoute component={Home} />}
          />
          <Route path="/subscription/select" component={SubscriptionSelect} />
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route path="/payment-cancelled" component={PaymentCancelled} />
          <Route path="/success" component={PaymentSuccess} />
          <Route path="/cancel" component={PaymentCancelled} />
        </>
      ) : (
        <>
          {/* Handle unauthenticated routes */}
          <Route path="/" component={Login} />
        </>
      )}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <HashHandler />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
