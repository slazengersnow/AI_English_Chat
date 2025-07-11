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
import Success from "@/pages/success";
import Cancel from "@/pages/cancel";
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
import NotFound from "@/pages/not-found";

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

  // Let HashHandler component handle all hash fragment processing
  useEffect(() => {
    const currentPath = window.location.pathname
    const hash = window.location.hash
    
    console.log('Router - Current path:', currentPath)
    console.log('Router - Hash:', hash)
    console.log('Router - Initialized')
  }, [])

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
      <Route path="/signup" component={Signup} />
      <Route path="/confirm" component={Confirm} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/debug-auth" component={DebugAuth} />
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
      <Route path="/test-actual-link" component={TestActualLink} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      
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
          <Route path="/success" component={Success} />
          <Route path="/cancel" component={Cancel} />
        </>
      ) : (
        <>
          {/* Handle unauthenticated routes */}
          <Route path="/" component={AuthRedirect} />
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
