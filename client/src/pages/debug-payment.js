import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
export default function DebugPayment() {
    const [currentPath, setCurrentPath] = useState(window.location.pathname);
    const setLocation = (path) => {
        window.history.pushState({}, "", path);
        setCurrentPath(path);
    };
    const [debugInfo, setDebugInfo] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
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
        return (_jsx("div", { className: "min-h-screen bg-gray-100 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading debug info..." })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-100 p-4", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs(Card, { className: "mb-6", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-600" }), "Payment Debug Information"] }), _jsx(CardDescription, { children: "Debugging payment success page rendering issues" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: Object.entries(debugInfo).map(([key, value]) => (_jsxs("div", { className: "flex justify-between items-center p-2 bg-gray-50 rounded", children: [_jsxs("span", { className: "font-medium text-gray-700", children: [key, ":"] }), _jsx("span", { className: "text-sm text-gray-600 font-mono max-w-md truncate", children: typeof value === "string" ? value : JSON.stringify(value) })] }, key))) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Navigation Test" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx(Button, { onClick: () => setLocation("/payment-success"), className: "w-full", children: "Go to Payment Success Page" }), _jsx(Button, { onClick: () => setLocation("/payment-cancelled"), variant: "outline", className: "w-full", children: "Go to Payment Cancelled Page" }), _jsx(Button, { onClick: () => setLocation("/"), variant: "outline", className: "w-full", children: "Go to Home" })] })] }), _jsxs(Card, { className: "mt-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Console Logs" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "bg-black text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-64", children: [_jsx("div", { children: "Check browser console for additional debug information" }), _jsxs("div", { children: ["Component mounted: ", debugInfo.componentMounted ? "Yes" : "No"] }), _jsxs("div", { children: ["State update test: ", debugInfo.stateUpdateTest || "pending..."] })] }) })] })] }) }));
}
