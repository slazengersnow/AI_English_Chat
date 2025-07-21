import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Users, MessageSquare, CreditCard, BarChart3, Download, Lock, Home } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
export default function Admin() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("overview");
    // Check admin access
    const { data: userSubscription, isLoading: isLoadingAuth } = useQuery({
        queryKey: ["/api/user-subscription"],
    });
    const { data: adminStats } = useQuery({
        queryKey: ["/api/admin/stats"],
        enabled: userSubscription?.isAdmin === true,
    });
    const { data: users } = useQuery({
        queryKey: ["/api/admin/users"],
        enabled: userSubscription?.isAdmin === true && activeTab === "users",
    });
    const { data: analytics } = useQuery({
        queryKey: ["/api/admin/analytics"],
        enabled: userSubscription?.isAdmin === true && activeTab === "analytics",
    });
    const exportDataMutation = useMutation({
        mutationFn: async (type) => {
            const response = await apiRequest("GET", `/api/admin/export/${type}`);
            return response.blob();
        },
        onSuccess: (blob, type) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast({
                title: "エクスポート完了",
                description: `${type}データのダウンロードが開始されました。`,
            });
        },
        onError: () => {
            toast({
                title: "エクスポートエラー",
                description: "データのエクスポートに失敗しました。",
                variant: "destructive",
            });
        },
    });
    const updateSubscriptionMutation = useMutation({
        mutationFn: async ({ userId, subscriptionType }) => {
            return await apiRequest("PUT", `/api/admin/users/${userId}/subscription`, {
                subscriptionType,
            });
        },
        onSuccess: () => {
            toast({
                title: "更新完了",
                description: "ユーザーのサブスクリプションタイプを更新しました。",
            });
            // Invalidate admin users data
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            // Force refetch user subscription cache for the top page after a small delay
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["/api/user-subscription"] });
                queryClient.refetchQueries({ queryKey: ["/api/user-subscription"] });
            }, 100);
        },
        onError: () => {
            toast({
                title: "更新エラー",
                description: "サブスクリプションタイプの更新に失敗しました。",
                variant: "destructive",
            });
        },
    });
    if (isLoadingAuth) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" }) }));
    }
    if (!userSubscription?.isAdmin) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: _jsxs(Card, { className: "max-w-md w-full", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center", children: _jsx(Lock, { className: "w-8 h-8 text-red-600" }) }), _jsx(CardTitle, { className: "text-xl text-red-800", children: "\u30A2\u30AF\u30BB\u30B9\u5236\u9650" }), _jsx(CardDescription, { className: "text-base", children: "\u3053\u306E\u30DA\u30FC\u30B8\u306F\u7BA1\u7406\u8005\u306E\u307F\u304C\u30A2\u30AF\u30BB\u30B9\u3067\u304D\u307E\u3059" })] }), _jsx(CardContent, { className: "text-center", children: _jsx(Link, { href: "/", children: _jsxs(Button, { variant: "outline", className: "w-full", children: [_jsx(Home, { className: "w-4 h-4 mr-2" }), "\u30DB\u30FC\u30E0\u306B\u623B\u308B"] }) }) })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-white border-b border-gray-200", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center py-6", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Shield, { className: "w-8 h-8 text-blue-600 mr-3" }), _jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "\u7BA1\u7406\u8005\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9" })] }), _jsx(Link, { href: "/", children: _jsxs(Button, { variant: "outline", children: [_jsx(Home, { className: "w-4 h-4 mr-2" }), "\u30DB\u30FC\u30E0\u306B\u623B\u308B"] }) })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsx("div", { className: "flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg", children: [
                            { id: "overview", label: "概要", icon: BarChart3 },
                            { id: "users", label: "ユーザー管理", icon: Users },
                            { id: "content", label: "コンテンツ管理", icon: MessageSquare },
                            { id: "payments", label: "決済状況", icon: CreditCard },
                            { id: "analytics", label: "学習分析", icon: BarChart3 },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"}`, children: [_jsx(Icon, { className: "w-4 h-4 mr-2" }), tab.label] }, tab.id));
                        }) }), activeTab === "overview" && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "\u7DCF\u30E6\u30FC\u30B6\u30FC\u6570" }), _jsx(Users, { className: "h-4 w-4 text-muted-foreground" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: adminStats?.totalUsers || 0 }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "\u7DCF\u5B66\u7FD2\u30BB\u30C3\u30B7\u30E7\u30F3" }), _jsx(BarChart3, { className: "h-4 w-4 text-muted-foreground" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: adminStats?.totalSessions || 0 }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "\u30A2\u30AF\u30C6\u30A3\u30D6\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3" }), _jsx(CreditCard, { className: "h-4 w-4 text-muted-foreground" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: adminStats?.activeSubscriptions || 0 }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "\u6708\u9593\u30A2\u30AF\u30C6\u30A3\u30D6\u30E6\u30FC\u30B6\u30FC" }), _jsx(Users, { className: "h-4 w-4 text-muted-foreground" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: adminStats?.monthlyActiveUsers || 0 }) })] })] })), activeTab === "users" && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "\u30E6\u30FC\u30B6\u30FC\u7BA1\u7406" }), _jsx(CardDescription, { children: "\u767B\u9332\u30E6\u30FC\u30B6\u30FC\u306E\u4E00\u89A7\u3068\u7BA1\u7406" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: users?.map((user) => (_jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg", children: [_jsx("div", { className: "flex-1", children: _jsx("div", { className: "font-medium", children: user.email }) }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Label, { htmlFor: `subscription-${user.id}`, className: "text-sm", children: "Standard" }), _jsx(Switch, { id: `subscription-${user.id}`, checked: user.subscriptionType === "premium", onCheckedChange: (checked) => {
                                                            const newSubscriptionType = checked ? "premium" : "standard";
                                                            updateSubscriptionMutation.mutate({
                                                                userId: user.id,
                                                                subscriptionType: newSubscriptionType
                                                            });
                                                        }, disabled: updateSubscriptionMutation.isPending }), _jsx(Label, { htmlFor: `subscription-${user.id}`, className: "text-sm", children: "Premium" })] })] }, user.id))) || _jsx("div", { className: "text-center py-8 text-gray-500", children: "\u30E6\u30FC\u30B6\u30FC\u30C7\u30FC\u30BF\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D..." }) }) })] })), activeTab === "content" && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "\u30B3\u30F3\u30C6\u30F3\u30C4\u7BA1\u7406" }), _jsx(CardDescription, { children: "\u6295\u7A3F\u30FB\u554F\u984C\u30FB\u30B3\u30F3\u30C6\u30F3\u30C4\u306E\u7BA1\u7406" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-center py-8 text-gray-500", children: "\u30B3\u30F3\u30C6\u30F3\u30C4\u7BA1\u7406\u6A5F\u80FD\u306F\u958B\u767A\u4E2D\u3067\u3059" }) })] })), activeTab === "payments" && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "\u6C7A\u6E08\u72B6\u6CC1\u78BA\u8A8D" }), _jsx(CardDescription, { children: "Stripe\u9023\u643A\u306B\u3088\u308B\u6C7A\u6E08\u60C5\u5831" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-center py-8 text-gray-500", children: "\u6C7A\u6E08\u72B6\u6CC1\u78BA\u8A8D\u6A5F\u80FD\u306F\u958B\u767A\u4E2D\u3067\u3059" }) })] })), activeTab === "analytics" && (_jsx("div", { className: "space-y-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "\u5B66\u7FD2\u5206\u6790" }), _jsx(CardDescription, { children: "\u30E6\u30FC\u30B6\u30FC\u306E\u5B66\u7FD2\u30C7\u30FC\u30BF\u3068\u7D71\u8A08" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => exportDataMutation.mutate("users"), disabled: exportDataMutation.isPending, children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), "\u30E6\u30FC\u30B6\u30FCCSV"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => exportDataMutation.mutate("sessions"), disabled: exportDataMutation.isPending, children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), "\u30BB\u30C3\u30B7\u30E7\u30F3CSV"] })] })] }), _jsx(CardContent, { children: analytics ? (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium mb-4", children: "\u5B66\u7FD2\u7D71\u8A08" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "\u7DCF\u5B66\u7FD2\u6642\u9593" }), _jsxs("span", { className: "font-medium", children: [analytics.totalLearningTime, "\u5206"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "\u7DCF\u5B66\u7FD2\u56DE\u6570" }), _jsxs("span", { className: "font-medium", children: [analytics.totalLearningCount, "\u56DE"] })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium mb-4", children: "\u30AB\u30C6\u30B4\u30EA\u5225\u6B63\u7B54\u7387" }), _jsx("div", { className: "space-y-2", children: analytics.categoryStats?.map((stat) => (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: stat.category }), _jsxs("span", { className: "font-medium", children: [stat.correctRate, "%"] })] }, stat.category))) })] })] })) : (_jsx("div", { className: "text-center py-8 text-gray-500", children: "\u5206\u6790\u30C7\u30FC\u30BF\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D..." })) })] }) }))] })] }));
}
