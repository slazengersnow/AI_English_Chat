"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wouter_1 = require("wouter");
const react_1 = require("react");
const queryClient_1 = require("./lib/queryClient");
const react_query_1 = require("@tanstack/react-query");
const toaster_1 = require("@/components/ui/toaster");
const tooltip_1 = require("@/components/ui/tooltip");
const auth_provider_1 = require("@/components/auth-provider");
const subscription_guard_1 = require("@/components/subscription-guard");
const home_1 = __importDefault(require("@/pages/home"));
const my_page_1 = __importDefault(require("@/pages/my-page"));
const simulation_selection_1 = __importDefault(require("@/pages/simulation-selection"));
const simulation_practice_1 = __importDefault(require("@/pages/simulation-practice"));
const admin_1 = __importDefault(require("@/pages/admin"));
const login_1 = __importDefault(require("@/pages/login"));
const signup_1 = __importDefault(require("@/pages/signup"));
const confirm_1 = __importDefault(require("@/pages/confirm"));
const terms_1 = __importDefault(require("@/pages/terms"));
const privacy_1 = __importDefault(require("@/pages/privacy"));
const subscription_select_1 = __importDefault(require("@/pages/subscription-select"));
const auth_callback_1 = __importDefault(require("@/pages/auth-callback"));
const debug_auth_1 = __importDefault(require("@/pages/debug-auth"));
const admin_setup_1 = __importDefault(require("@/pages/admin-setup"));
const password_reset_1 = __importDefault(require("@/pages/password-reset"));
const reset_password_1 = __importDefault(require("@/pages/reset-password"));
const redirect_handler_1 = __importDefault(require("@/pages/redirect-handler"));
const hash_handler_1 = require("@/components/hash-handler");
const test_hash_1 = __importDefault(require("@/pages/test-hash"));
const auth_redirect_1 = __importDefault(require("@/pages/auth-redirect"));
const debug_email_1 = __importDefault(require("@/pages/debug-email"));
const comprehensive_debug_1 = __importDefault(require("@/pages/comprehensive-debug"));
const email_test_1 = __importDefault(require("@/pages/email-test"));
const supabase_config_check_1 = __importDefault(require("@/pages/supabase-config-check"));
const fix_email_1 = __importDefault(require("@/pages/fix-email"));
const direct_access_1 = __importDefault(require("@/pages/direct-access"));
const test_actual_link_1 = __importDefault(require("@/pages/test-actual-link"));
const stripe_test_1 = __importDefault(require("@/pages/stripe-test"));
const price_check_1 = __importDefault(require("@/pages/price-check"));
const payment_success_1 = __importDefault(require("@/pages/payment-success"));
const payment_cancelled_1 = __importDefault(require("@/pages/payment-cancelled"));
const debug_payment_1 = __importDefault(require("@/pages/debug-payment"));
const stripe_checkout_debug_1 = __importDefault(require("@/pages/stripe-checkout-debug"));
const stripe_price_check_1 = __importDefault(require("@/pages/stripe-price-check"));
const plan_configuration_1 = __importDefault(require("@/pages/plan-configuration"));
const simple_price_setup_1 = __importDefault(require("@/pages/simple-price-setup"));
const not_found_1 = __importDefault(require("@/pages/not-found"));
const logout_1 = __importDefault(require("@/pages/logout"));
// Protected routes that require active subscription
function ProtectedRoute({ component: Component }) {
    return (<subscription_guard_1.SubscriptionGuard>
      <Component />
    </subscription_guard_1.SubscriptionGuard>);
}
function Router() {
    const { isAuthenticated, isLoading } = (0, auth_provider_1.useAuth)();
    const [, setLocation] = (0, wouter_1.useLocation)();
    // Let HashHandler component handle all hash fragment processing
    (0, react_1.useEffect)(() => {
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
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"/>
      </div>);
    }
    return (<wouter_1.Switch>
      {/* Public routes */}
      <wouter_1.Route path="/login" component={login_1.default}/>
      <wouter_1.Route path="/signup" component={signup_1.default}/>
      <wouter_1.Route path="/confirm" component={confirm_1.default}/>
      <wouter_1.Route path="/auth/callback" component={auth_callback_1.default}/>
      <wouter_1.Route path="/debug-auth" component={debug_auth_1.default}/>
      <wouter_1.Route path="/admin-setup" component={admin_setup_1.default}/>
      <wouter_1.Route path="/password-reset" component={password_reset_1.default}/>
      <wouter_1.Route path="/reset-password" component={reset_password_1.default}/>
      <wouter_1.Route path="/redirect-handler" component={redirect_handler_1.default}/>
      <wouter_1.Route path="/auth-redirect" component={auth_redirect_1.default}/>
      <wouter_1.Route path="/test-hash" component={test_hash_1.default}/>
      <wouter_1.Route path="/debug-email" component={debug_email_1.default}/>
      <wouter_1.Route path="/comprehensive-debug" component={comprehensive_debug_1.default}/>
      <wouter_1.Route path="/email-test" component={email_test_1.default}/>
      <wouter_1.Route path="/supabase-config-check" component={supabase_config_check_1.default}/>
      <wouter_1.Route path="/fix-email" component={fix_email_1.default}/>
      <wouter_1.Route path="/direct-access" component={direct_access_1.default}/>
      <wouter_1.Route path="/auth-callback" component={auth_callback_1.default}/>
      <wouter_1.Route path="/auth/callback" component={auth_callback_1.default}/>
      <wouter_1.Route path="/test-actual-link" component={test_actual_link_1.default}/>
      <wouter_1.Route path="/stripe-test" component={stripe_test_1.default}/>
      <wouter_1.Route path="/price-check" component={price_check_1.default}/>
      <wouter_1.Route path="/debug-payment" component={debug_payment_1.default}/>
      <wouter_1.Route path="/stripe-checkout-debug" component={stripe_checkout_debug_1.default}/>
      <wouter_1.Route path="/stripe-price-check" component={stripe_price_check_1.default}/>
      <wouter_1.Route path="/plan-configuration" component={plan_configuration_1.default}/>
      <wouter_1.Route path="/price-setup" component={simple_price_setup_1.default}/>
      <wouter_1.Route path="/payment-success" component={payment_success_1.default}/>
      <wouter_1.Route path="/payment-cancelled" component={payment_cancelled_1.default}/>
      <wouter_1.Route path="/success" component={payment_success_1.default}/>
      <wouter_1.Route path="/cancel" component={payment_cancelled_1.default}/>
      <wouter_1.Route path="/terms" component={terms_1.default}/>
      <wouter_1.Route path="/privacy" component={privacy_1.default}/>
      <wouter_1.Route path="/logout" component={logout_1.default}/>
      
      {isAuthenticated ? (<>
          {/* Protected routes for authenticated users */}
          <wouter_1.Route path="/" component={() => <ProtectedRoute component={home_1.default}/>}/>
          <wouter_1.Route path="/my-page" component={() => <ProtectedRoute component={my_page_1.default}/>}/>
          <wouter_1.Route path="/simulation" component={() => <ProtectedRoute component={simulation_selection_1.default}/>}/>
          <wouter_1.Route path="/simulation/:id" component={() => <ProtectedRoute component={simulation_practice_1.default}/>}/>
          <wouter_1.Route path="/simulation-practice" component={() => <ProtectedRoute component={simulation_practice_1.default}/>}/>
          <wouter_1.Route path="/admin" component={() => <ProtectedRoute component={admin_1.default}/>}/>
          <wouter_1.Route path="/chat/:difficulty" component={() => <ProtectedRoute component={home_1.default}/>}/>
          <wouter_1.Route path="/practice/:difficulty" component={() => <ProtectedRoute component={home_1.default}/>}/>
          <wouter_1.Route path="/subscription/select" component={subscription_select_1.default}/>
          <wouter_1.Route path="/payment-success" component={payment_success_1.default}/>
          <wouter_1.Route path="/payment-cancelled" component={payment_cancelled_1.default}/>
          <wouter_1.Route path="/success" component={payment_success_1.default}/>
          <wouter_1.Route path="/cancel" component={payment_cancelled_1.default}/>
        </>) : (<>
          {/* Handle unauthenticated routes */}
          <wouter_1.Route path="/" component={login_1.default}/>
        </>)}
      
      <wouter_1.Route component={not_found_1.default}/>
    </wouter_1.Switch>);
}
function App() {
    return (<react_query_1.QueryClientProvider client={queryClient_1.queryClient}>
      <auth_provider_1.AuthProvider>
        <tooltip_1.TooltipProvider>
          <toaster_1.Toaster />
          <hash_handler_1.HashHandler />
          <Router />
        </tooltip_1.TooltipProvider>
      </auth_provider_1.AuthProvider>
    </react_query_1.QueryClientProvider>);
}
exports.default = App;
