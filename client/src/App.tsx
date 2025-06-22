import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import MyPage from "@/pages/my-page";
import SimulationSelection from "@/pages/simulation-selection";
import SimulationPractice from "@/pages/simulation-practice";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/my-page" component={MyPage} />
      <Route path="/simulation" component={SimulationSelection} />
      <Route path="/simulation/:id" component={SimulationPractice} />
      <Route path="/simulation-practice" component={SimulationPractice} />
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
