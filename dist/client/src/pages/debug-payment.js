"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DebugPayment;
const react_1 = require("react");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
function DebugPayment() {
    const [currentPath, setCurrentPath] = (0, react_1.useState)(window.location.pathname);
    const setLocation = (path) => {
        window.history.pushState({}, "", path);
        setCurrentPath(path);
    };
    const [debugInfo, setDebugInfo] = (0, react_1.useState)({});
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        console.log("DebugPayment component mounted");
        const info = {
            currentUrl: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            sessionId: new URLSearchParams(window.location.search).get("session_id"),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            componentMounted: true,
        };
        console.log("Debug info:", info);
        setDebugInfo(info);
        setIsLoading(false);
        // Test if the component can update state
        setTimeout(() => {
            setDebugInfo((prev) => ({
                ...prev,
                stateUpdateTest: "passed",
            }));
        }, 1000);
    }, []);
    if (isLoading) {
        return (<div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading debug info...</p>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <card_1.Card className="mb-6">
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.CheckCircle className="w-5 h-5 text-green-600"/>
              Payment Debug Information
            </card_1.CardTitle>
            <card_1.CardDescription>
              Debugging payment success page rendering issues
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-4">
              {Object.entries(debugInfo).map(([key, value]) => (<div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">{key}:</span>
                  <span className="text-sm text-gray-600 font-mono max-w-md truncate">
                    {typeof value === "string" ? value : JSON.stringify(value)}
                  </span>
                </div>))}
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Navigation Test</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <button_1.Button onClick={() => setLocation("/payment-success")} className="w-full">
              Go to Payment Success Page
            </button_1.Button>
            <button_1.Button onClick={() => setLocation("/payment-cancelled")} variant="outline" className="w-full">
              Go to Payment Cancelled Page
            </button_1.Button>
            <button_1.Button onClick={() => setLocation("/")} variant="outline" className="w-full">
              Go to Home
            </button_1.Button>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card className="mt-6">
          <card_1.CardHeader>
            <card_1.CardTitle>Console Logs</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-64">
              <div>Check browser console for additional debug information</div>
              <div>
                Component mounted: {debugInfo.componentMounted ? "Yes" : "No"}
              </div>
              <div>
                State update test: {debugInfo.stateUpdateTest || "pending..."}
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
