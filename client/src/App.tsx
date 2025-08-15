import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { queryClient } from "./lib/queryClient.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster.js";
import { TooltipProvider } from "./components/ui/tooltip.js";
import { AuthProvider, useAuth } from "./providers/auth-provider.js";
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
import AuthTest from "./pages/auth-test.js";
import AuthDebugTest from "./pages/auth-debug-test.js";
import LoginDebug from "./pages/login-debug.js";
import AuthTestComplete from "./pages/auth-test-complete.js";
import SimpleAuthTest from "./pages/simple-auth-test.js";
import IframeAuthTest from "./pages/iframe-auth-test.js";
import SessionDebug from "./pages/session-debug.js";
import SupabaseConnectionTest from "./pages/supabase-connection-test.js";
import NetworkCorsTest from "./pages/network-cors-test.js";
import Login from "./pages/login.js";

// ローディングコンポーネント
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// 公開パス（認証不要）の定義 - メールフローを必ず含める
const publicPaths = new Set([
  "/login",
  "/signup", 
  "/signup-simple",
  "/auth-callback",
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
  "/redirect-handler",
  "/auth-redirect",
  "/test-hash",
  "/debug-email",
  "/comprehensive-debug",
  "/email-test",
  "/supabase-config-check",
  "/fix-email",
  "/direct-access",
  "/test-actual-link",
  "/stripe-test",
  "/price-check",
  "/debug-payment",
  "/stripe-checkout-debug",
  "/stripe-price-check",
  "/plan-configuration",
  "/price-setup",
  "/payment-success",
  "/payment-cancelled",
  "/success",
  "/cancel",
  "/logout",
  "/oauth-fix",
  "/emergency-login",
  "/working-login",
  "/final-auth-test",
  "/replit-auth-fix",
  "/emergency-auth-fix",
  "/auth-test",
  "/auth-debug-test",
  "/login-debug",
  "/auth-test-complete",
  "/simple-auth-test",
  "/iframe-auth-test",
  "/session-debug",
  "/supabase-connection-test",
  "/network-cors-test",
  "/login",
]);

function Guard({ children }: { children: JSX.Element }) {
  const { user, initialized } = useAuth();
  const pathname = window.location.pathname;

  if (!initialized) return <div style={{padding:24}}>Loading...</div>;

  const publicPaths = ["/", "/login", "/signup", "/signup-simple", "/auth-callback"];
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + "/"));
  if (isPublic) return children;

  if (!user) {
    window.location.href = "/login";
    return <div style={{padding:24}}>Redirecting to login...</div>;
  }
  return children;
}

// サブスクリプション保護が必要なルート用のコンポーネント
function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  return (
    <SubscriptionGuard>
      <Component />
    </SubscriptionGuard>
  );
}

// ルーター設定
function AppRoutes() {
  return (
    <Routes>
      {/* 公開ルート */}
      <Route
        path="/login"
        element={
          <Guard>
            <Login />
          </Guard>
        }
      />
      <Route
        path="/signup"
        element={
          <Guard>
            <Signup />
          </Guard>
        }
      />
      <Route
        path="/signup-simple"
        element={
          <Guard>
            <SignupSimple />
          </Guard>
        }
      />
      <Route
        path="/subscription-select"
        element={
          <Guard>
            <SubscriptionSelect />
          </Guard>
        }
      />
      <Route
        path="/confirm"
        element={
          <Guard>
            <Confirm />
          </Guard>
        }
      />
      <Route
        path="/auth/callback"
        element={
          <Guard>
            <AuthCallback />
          </Guard>
        }
      />
      <Route
        path="/terms"
        element={
          <Guard>
            <Terms />
          </Guard>
        }
      />
      <Route
        path="/privacy"
        element={
          <Guard>
            <Privacy />
          </Guard>
        }
      />
      <Route
        path="/debug-auth"
        element={
          <Guard>
            <DebugAuth />
          </Guard>
        }
      />
      <Route
        path="/debug"
        element={
          <Guard>
            <DebugPage />
          </Guard>
        }
      />
      <Route
        path="/login-test"
        element={
          <Guard>
            <LoginTest />
          </Guard>
        }
      />
      <Route
        path="/create-admin"
        element={
          <Guard>
            <CreateAdmin />
          </Guard>
        }
      />
      <Route
        path="/admin-setup"
        element={
          <Guard>
            <AdminSetup />
          </Guard>
        }
      />
      <Route
        path="/password-reset"
        element={
          <Guard>
            <PasswordReset />
          </Guard>
        }
      />
      <Route
        path="/reset-password"
        element={
          <Guard>
            <ResetPassword />
          </Guard>
        }
      />
      <Route
        path="/simple-login"
        element={
          <Guard>
            <SimpleLogin />
          </Guard>
        }
      />
      <Route
        path="/redirect-handler"
        element={
          <Guard>
            <RedirectHandler />
          </Guard>
        }
      />
      <Route
        path="/auth-redirect"
        element={
          <Guard>
            <AuthRedirect />
          </Guard>
        }
      />
      <Route
        path="/test-hash"
        element={
          <Guard>
            <TestHash />
          </Guard>
        }
      />
      <Route
        path="/debug-email"
        element={
          <Guard>
            <DebugEmail />
          </Guard>
        }
      />
      <Route
        path="/comprehensive-debug"
        element={
          <Guard>
            <ComprehensiveDebug />
          </Guard>
        }
      />
      <Route
        path="/email-test"
        element={
          <Guard>
            <EmailTest />
          </Guard>
        }
      />
      <Route
        path="/supabase-config-check"
        element={
          <Guard>
            <SupabaseConfigCheck />
          </Guard>
        }
      />
      <Route
        path="/fix-email"
        element={
          <Guard>
            <FixEmail />
          </Guard>
        }
      />
      <Route
        path="/direct-access"
        element={
          <Guard>
            <DirectAccess />
          </Guard>
        }
      />
      <Route
        path="/auth-callback"
        element={
          <Guard>
            <AuthCallback />
          </Guard>
        }
      />
      <Route
        path="/test-actual-link"
        element={
          <Guard>
            <TestActualLink />
          </Guard>
        }
      />
      <Route
        path="/stripe-test"
        element={
          <Guard>
            <StripeTest />
          </Guard>
        }
      />
      <Route
        path="/price-check"
        element={
          <Guard>
            <PriceCheck />
          </Guard>
        }
      />
      <Route
        path="/debug-payment"
        element={
          <Guard>
            <DebugPayment />
          </Guard>
        }
      />
      <Route
        path="/stripe-checkout-debug"
        element={
          <Guard>
            <StripeCheckoutDebug />
          </Guard>
        }
      />
      <Route
        path="/stripe-price-check"
        element={
          <Guard>
            <StripePriceCheck />
          </Guard>
        }
      />
      <Route
        path="/plan-configuration"
        element={
          <Guard>
            <PlanConfiguration />
          </Guard>
        }
      />
      <Route
        path="/price-setup"
        element={
          <Guard>
            <SimplePriceSetup />
          </Guard>
        }
      />
      <Route
        path="/payment-success"
        element={
          <Guard>
            <PaymentSuccess />
          </Guard>
        }
      />
      <Route
        path="/payment-cancelled"
        element={
          <Guard>
            <PaymentCancelled />
          </Guard>
        }
      />
      <Route
        path="/success"
        element={
          <Guard>
            <PaymentSuccess />
          </Guard>
        }
      />
      <Route
        path="/cancel"
        element={
          <Guard>
            <PaymentCancelled />
          </Guard>
        }
      />
      <Route
        path="/logout"
        element={
          <Guard>
            <Logout />
          </Guard>
        }
      />
      <Route
        path="/oauth-fix"
        element={
          <Guard>
            <OAuthFix />
          </Guard>
        }
      />
      <Route
        path="/emergency-login"
        element={
          <Guard>
            <EmergencyLogin />
          </Guard>
        }
      />
      <Route
        path="/working-login"
        element={
          <Guard>
            <WorkingLogin />
          </Guard>
        }
      />
      <Route
        path="/final-auth-test"
        element={
          <Guard>
            <FinalAuthTest />
          </Guard>
        }
      />
      <Route
        path="/replit-auth-fix"
        element={
          <Guard>
            <ReplitAuthFix />
          </Guard>
        }
      />
      <Route
        path="/emergency-auth-fix"
        element={
          <Guard>
            <EmergencyAuthFix />
          </Guard>
        }
      />
      <Route
        path="/auth-test"
        element={
          <Guard>
            <AuthTest />
          </Guard>
        }
      />
      <Route
        path="/auth-debug-test"
        element={
          <Guard>
            <AuthDebugTest />
          </Guard>
        }
      />
      <Route
        path="/login-debug"
        element={
          <Guard>
            <LoginDebug />
          </Guard>
        }
      />
      <Route
        path="/auth-test-complete"
        element={
          <Guard>
            <AuthTestComplete />
          </Guard>
        }
      />
      <Route
        path="/simple-auth-test"
        element={
          <Guard>
            <SimpleAuthTest />
          </Guard>
        }
      />
      <Route
        path="/iframe-auth-test"
        element={
          <Guard>
            <IframeAuthTest />
          </Guard>
        }
      />
      <Route
        path="/session-debug"
        element={
          <Guard>
            <SessionDebug />
          </Guard>
        }
      />
      <Route
        path="/supabase-connection-test"
        element={
          <Guard>
            <SupabaseConnectionTest />
          </Guard>
        }
      />
      <Route
        path="/network-cors-test"
        element={
          <Guard>
            <NetworkCorsTest />
          </Guard>
        }
      />
      
      {/* Public Routes - No Authentication Required */}
      <Route path="/login" element={<Login />} />

      {/* 認証が必要なルート */}
      <Route
        path="/"
        element={
          <Guard>
            <Home />
          </Guard>
        }
      />
      <Route
        path="/my-page"
        element={
          <Guard>
            <ProtectedRoute component={MyPage} />
          </Guard>
        }
      />
      <Route
        path="/simulation"
        element={
          <Guard>
            <ProtectedRoute component={SimulationSelection} />
          </Guard>
        }
      />
      <Route
        path="/simulation/:id"
        element={
          <Guard>
            <ProtectedRoute component={SimulationPractice} />
          </Guard>
        }
      />
      <Route
        path="/simulation-practice"
        element={
          <Guard>
            <ProtectedRoute component={SimulationPractice} />
          </Guard>
        }
      />
      <Route
        path="/admin"
        element={
          <Guard>
            <ProtectedRoute component={Admin} />
          </Guard>
        }
      />
      <Route
        path="/chat/:difficulty"
        element={
          <Guard>
            <ProtectedRoute component={Home} />
          </Guard>
        }
      />
      <Route
        path="/practice/:difficulty"
        element={
          <Guard>
            <ProtectedRoute component={Home} />
          </Guard>
        }
      />
      <Route
        path="/subscription-select"
        element={
          <Guard>
            <SubscriptionSelect />
          </Guard>
        }
      />

      {/* 404 Not Found */}
      <Route
        path="*"
        element={
          <Guard>
            <NotFound />
          </Guard>
        }
      />
    </Routes>
  );
}

// メインアプリケーションコンポーネント
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <TooltipProvider>
            <Toaster />
            <HashHandler />
            <AppRoutes />
          </TooltipProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;