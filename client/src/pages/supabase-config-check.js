import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@shared/supabase";
import { AlertCircle, CheckCircle, XCircle, Settings } from "lucide-react";
export default function SupabaseConfigCheck() {
    const [configData, setConfigData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    useEffect(() => {
        checkConfiguration();
    }, []);
    const checkConfiguration = async () => {
        setIsLoading(true);
        try {
            // Check environment variables
            const envConfig = {
                hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
                hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
                supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
                keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
                isDev: import.meta.env.DEV,
                mode: import.meta.env.MODE,
            };
            // Check Supabase client initialization
            const clientCheck = {
                clientInitialized: !!supabase,
                clientUrl: import.meta.env.VITE_SUPABASE_URL,
                clientKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + "...",
            };
            // Test basic Supabase operations
            const operationTests = [];
            // Test 1: Get session
            try {
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                operationTests.push({
                    test: "getSession",
                    success: !sessionError,
                    result: sessionError ? sessionError.message : "Success",
                    hasUser: !!sessionData?.session?.user,
                });
            }
            catch (e) {
                operationTests.push({
                    test: "getSession",
                    success: false,
                    result: e.message || String(e),
                    hasUser: false,
                });
            }
            // Test 2: Get user
            try {
                const { data: userData, error: userError } = await supabase.auth.getUser();
                operationTests.push({
                    test: "getUser",
                    success: !userError,
                    result: userError ? userError.message : "Success",
                    hasUser: !!userData?.user,
                });
            }
            catch (e) {
                operationTests.push({
                    test: "getUser",
                    success: false,
                    result: e.message || String(e),
                    hasUser: false,
                });
            }
            // Test 3: Test password reset with different scenarios
            const resetTests = [];
            const testEmails = [
                "test@example.com",
                "noreply@example.com",
                "admin@example.com",
            ];
            for (const email of testEmails) {
                try {
                    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                    });
                    resetTests.push({
                        email,
                        success: !error,
                        result: error ? error.message : "Reset request sent",
                        data: data || null,
                    });
                }
                catch (e) {
                    resetTests.push({
                        email,
                        success: false,
                        result: e.message || String(e),
                        data: null,
                    });
                }
                // Wait to avoid rate limiting
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            // Network and URL tests
            const networkTests = {
                origin: window.location.origin,
                host: window.location.host,
                protocol: window.location.protocol,
                isHttps: window.location.protocol === "https:",
                userAgent: navigator.userAgent,
                language: navigator.language,
            };
            setConfigData({
                envConfig,
                clientCheck,
                operationTests,
                resetTests,
                networkTests,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Configuration check error:", error);
            toast({
                title: "設定チェックエラー",
                description: "設定確認中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const renderStatus = (success) => {
        return success ? (_jsx(CheckCircle, { className: "w-5 h-5 text-green-500" })) : (_jsx(XCircle, { className: "w-5 h-5 text-red-500" }));
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-4xl", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsxs(CardTitle, { className: "text-2xl flex items-center justify-center gap-2", children: [_jsx(Settings, { className: "w-6 h-6" }), "Supabase\u8A2D\u5B9A\u8A3A\u65AD"] }), _jsx(CardDescription, { children: "\u74B0\u5883\u5909\u6570\u3001\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u521D\u671F\u5316\u3001\u30E1\u30FC\u30EB\u9001\u4FE1\u6A5F\u80FD\u306E\u8A73\u7D30\u30C1\u30A7\u30C3\u30AF" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsx("div", { className: "flex justify-center", children: _jsx(Button, { onClick: checkConfiguration, disabled: isLoading, className: "w-full max-w-md", children: isLoading ? "診断中..." : "設定を再チェック" }) }), configData && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white border rounded-lg p-4", children: [_jsxs("h3", { className: "font-semibold mb-3 flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), "\u74B0\u5883\u8A2D\u5B9A"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [renderStatus(configData.envConfig.hasSupabaseUrl), _jsxs("span", { children: ["Supabase URL:", " ", configData.envConfig.hasSupabaseUrl
                                                                    ? "設定済み"
                                                                    : "未設定"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [renderStatus(configData.envConfig.hasSupabaseKey), _jsxs("span", { children: ["Supabase Key:", " ", configData.envConfig.hasSupabaseKey
                                                                    ? "設定済み"
                                                                    : "未設定"] })] }), _jsxs("div", { className: "text-xs text-gray-600 col-span-2", children: ["URL: ", configData.envConfig.supabaseUrl] }), _jsxs("div", { className: "text-xs text-gray-600 col-span-2", children: ["Key\u9577: ", configData.envConfig.keyLength, " \u6587\u5B57"] })] })] }), _jsxs("div", { className: "bg-white border rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold mb-3", children: "\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u521D\u671F\u5316" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [renderStatus(configData.clientCheck.clientInitialized), _jsxs("span", { children: ["\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u521D\u671F\u5316:", " ", configData.clientCheck.clientInitialized
                                                                    ? "成功"
                                                                    : "失敗"] })] }), _jsxs("div", { className: "text-xs text-gray-600", children: ["\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8URL: ", configData.clientCheck.clientUrl] })] })] }), _jsxs("div", { className: "bg-white border rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold mb-3", children: "\u57FA\u672C\u64CD\u4F5C\u30C6\u30B9\u30C8" }), _jsx("div", { className: "space-y-2", children: configData.operationTests.map((test, index) => (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [renderStatus(test.success), _jsxs("span", { children: [test.test, ": ", test.result] })] }, index))) })] }), _jsxs("div", { className: "bg-white border rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold mb-3", children: "\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8\u30C6\u30B9\u30C8" }), _jsx("div", { className: "space-y-2", children: configData.resetTests.map((test, index) => (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [renderStatus(test.success), _jsxs("span", { children: [test.email, ": ", test.result] })] }, index))) })] }), _jsxs("div", { className: "bg-white border rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold mb-3", children: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u60C5\u5831" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { children: ["Origin: ", configData.networkTests.origin] }), _jsxs("div", { children: ["Host: ", configData.networkTests.host] }), _jsxs("div", { children: ["Protocol: ", configData.networkTests.protocol] }), _jsxs("div", { className: "flex items-center gap-2", children: [renderStatus(configData.networkTests.isHttps), _jsxs("span", { children: ["HTTPS: ", configData.networkTests.isHttps ? "有効" : "無効"] })] })] })] }), _jsxs("div", { className: "bg-gray-50 border rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold mb-3", children: "\u8A73\u7D30\u30C7\u30FC\u30BF" }), _jsx("pre", { className: "text-xs overflow-auto max-h-96 bg-gray-900 text-green-400 p-3 rounded", children: JSON.stringify(configData, null, 2) })] })] }))] })] }) }));
}
