import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";

type DebugInfoType = {
  [key: string]: any;
};

export default function DebugPayment() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const setLocation = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };
  const [debugInfo, setDebugInfo] = useState<DebugInfoType>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("DebugPayment component mounted");

    const info: DebugInfoType = {
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
      setDebugInfo((prev: DebugInfoType) => ({
        ...prev,
        stateUpdateTest: "passed",
      }));
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading debug info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Payment Debug Information
            </CardTitle>
            <CardDescription>
              Debugging payment success page rendering issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(debugInfo).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <span className="font-medium text-gray-700">{key}:</span>
                  <span className="text-sm text-gray-600 font-mono max-w-md truncate">
                    {typeof value === "string" ? value : JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setLocation("/payment-success")}
              className="w-full"
            >
              Go to Payment Success Page
            </Button>
            <Button
              onClick={() => setLocation("/payment-cancelled")}
              variant="outline"
              className="w-full"
            >
              Go to Payment Cancelled Page
            </Button>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Console Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-64">
              <div>Check browser console for additional debug information</div>
              <div>
                Component mounted: {debugInfo.componentMounted ? "Yes" : "No"}
              </div>
              <div>
                State update test: {debugInfo.stateUpdateTest || "pending..."}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
