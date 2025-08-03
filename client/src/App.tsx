import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient.js";
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
import Success from "@/pages/success";
import Cancel from "@/pages/cancel";
import Login from "@/pages/login";
import LoginTest from "@/pages/login-test";
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
import DebugPage from "@/pages/debug";
import SimpleLogin from "@/pages/simple-login";
import CreateAdmin from "@/pages/create-admin";
import NotFound from "@/pages/not-found";
import Logout from "@/pages/logout";
import OAuthFix from "@/pages/oauth-fix";
import EmergencyLogin from "@/pages/emergency-login";
import WorkingLogin from "@/pages/working-login";
import FinalAuthTest from "@/pages/final-auth-test";
import ReplitAuthFix from "@/pages/replit-auth-fix";
import EmergencyAuthFix from "@/pages/emergency-auth-fix";

// Protected routes that require active subscription
function ProtectedRoute({ component: Component }: { component: any }) {
  return (
    <SubscriptionGuard>
      <Component />
    </SubscriptionGuard>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth()
  const [, setLocation] = useLocation()

  // Temporarily disable auth redirect for debugging
  useEffect(() => {
    console.log('Router - Auth check disabled for debugging')
    console.log('Router - Current path:', window.location.pathname)
    console.log('Router - Auth status:', { isAuthenticated, isLoading })
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/create-admin" component={CreateAdmin} />
      <Route path="/login-test" component={LoginTest} />
      <Route path="/signup" component={Signup} />
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
      
      {isAuthenticated ? (
        <>
          {/* Protected routes for authenticated users */}
          <Route path="/" component={() => <ProtectedRoute component={Home} />} />
          <Route path="/my-page" component={() => <ProtectedRoute component={MyPage} />} />
          <Route path="/simulation" component={() => <ProtectedRoute component={SimulationSelection} />} />
          <Route path="/simulation/:id" component={() => <ProtectedRoute component={SimulationPractice} />} />
          <Route path="/simulation-practice" component={() => <ProtectedRoute component={SimulationPractice} />} />
          <Route path="/admin" component={() => <ProtectedRoute component={Admin} />} />
          <Route path="/chat/:difficulty" component={() => <ProtectedRoute component={Home} />} />
          <Route path="/practice/:difficulty" component={() => <ProtectedRoute component={Home} />} />
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
