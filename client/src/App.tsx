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
// import SupabaseConnectionDebug from "./pages/supabase-connection-debug.js"; // 一時的にコメントアウト

// ローディングコンポーネント
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p className="mt-4 text-gray-600">認証情報を確認中...</p>
  </div>
);

// 公開パス（認証不要）の定義
const publicPaths = new Set([
  "/login",
  "/signup",
  "/signup-simple",
  "/subscription-select",
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
  "/auth-callback",
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
  "/supabase-debug",
  "/supabase-connection-test",
  "/network-cors-test",
]);

// 認証ガードコンポーネント（デバッグログ付き）
function Guard({ children }: { children: JSX.Element }) {
  const { user, initialized } = useAuth();
  const { pathname } = useLocation();
  
  // 詳細デバッグログ
  console.log('=== GUARD DEBUG ===', {
    pathname,
    user: user ? { email: user.email } : null,
    initialized,
    isPublicPath: publicPaths.has(pathname)
  });

  // 開発環境では一時的に全てバイパス
  if (window.location.hostname.includes('replit')) {
    console.log('Guard: REPLIT環境バイパス');
    return children;
  }

  // 通常のロジック
  if (publicPaths.has(pathname)) return children;
  if (!initialized) return <LoadingSpinner />;
  if (!user) {
    console.log('Guard: ユーザーなし→ログインリダイレクト');
    return <Navigate to="/login" replace />;
  }
  
  console.log('Guard: 認証OK');
  return children;
}

// サブスクリプション保護が必要なルート用のコンポーネント
function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  console.log("ProtectedRoute: SubscriptionGuard通過中...");
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
      {/* <Route
        path="/supabase-debug"
        element={
          <Guard>
            <SupabaseConnectionTest />
          </Guard>
        }
      /> */}

      {/* 認証が必要なルート */}
      <Route
        path="/"
        element={
          <Guard>
            <ProtectedRoute component={Home} />
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
        path="/subscription/select"
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
  console.log("=== APP COMPONENT INITIALIZED ===");
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
