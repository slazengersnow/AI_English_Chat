import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import Terms from "@/pages/terms";
import SubscriptionSelect from "@/pages/subscription-select";
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
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/terms" component={Terms} />
      <Route path="/subscription/select" component={SubscriptionSelect} />
      <Route path="/success" component={Success} />
      <Route path="/cancel" component={Cancel} />
      
      {/* Protected routes */}
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/my-page" component={() => <ProtectedRoute component={MyPage} />} />
      <Route path="/simulation" component={() => <ProtectedRoute component={SimulationSelection} />} />
      <Route path="/simulation/:id" component={() => <ProtectedRoute component={SimulationPractice} />} />
      <Route path="/simulation-practice" component={() => <ProtectedRoute component={SimulationPractice} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={Admin} />} />
      <Route path="/chat/:difficulty" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/practice/:difficulty" component={() => <ProtectedRoute component={Home} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
