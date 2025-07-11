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

  // Handle global redirects based on hash fragments
  useEffect(() => {
    const handleGlobalRedirect = () => {
      const hash = window.location.hash
      const currentPath = window.location.pathname
      
      console.log('Router - Current path:', currentPath)
      console.log('Router - Hash:', hash)
      
      // Handle password reset globally
      if (hash && hash.includes('type=recovery')) {
        console.log('Redirecting to reset-password due to recovery hash')
        setTimeout(() => {
          setLocation('/reset-password')
        }, 100)
      }
    }
    
    handleGlobalRedirect()
    
    // Listen for hash changes globally
    const handleHashChange = () => {
      console.log('Global hash changed:', window.location.hash)
      handleGlobalRedirect()
    }

    window.addEventListener('hashchange', handleHashChange)
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [setLocation])

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
          <Route path="/" component={RedirectHandler} />
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
