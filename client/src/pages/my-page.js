import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, } from "recharts";
import { User, TrendingUp, Calendar, Star, Bookmark, RotateCcw, Plus, Edit, Trash2, ArrowLeft, ArrowRight, Home, RefreshCw, Settings, Crown, CreditCard, ExternalLink, LogOut, Shield, } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Link } from "wouter";
export default function MyPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { user, isAdmin, signOut } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    // Check URL for tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get("tab");
    const [activeTab, setActiveTab] = useState(tabFromUrl || "progress");
    const [selectedPeriod, setSelectedPeriod] = useState("week");
    const [newScenario, setNewScenario] = useState({
        title: "",
        description: "",
    });
    const [editingScenario, setEditingScenario] = useState(null);
    const { subscription, canAccessPremiumFeatures } = useSubscription();
    // API queries
    const { data: progressData = [] } = useQuery({
        queryKey: ["/api/progress", selectedPeriod],
    });
    const { data: streakData } = useQuery({
        queryKey: ["/api/streak"],
    });
    const { data: difficultyStats = [] } = useQuery({
        queryKey: ["/api/difficulty-stats"],
    });
    const { data: monthlyStats } = useQuery({
        queryKey: ["/api/monthly-stats"],
    });
    const { data: reviewSessions = [] } = useQuery({
        queryKey: ["/api/review-sessions"],
    });
    // Recent sessions (past week)
    const { data: recentSessions = [] } = useQuery({
        queryKey: ["/api/recent-sessions"],
    });
    // Subscription details for account tab
    const { data: subscriptionDetails } = useQuery({
        queryKey: ["/api/subscription-details"],
        enabled: activeTab === "account",
    });
    const { data: rechallengeList = [] } = useQuery({
        queryKey: ["/api/review-sessions", { threshold: 3 }],
        queryFn: () => fetch("/api/review-sessions?threshold=3").then((res) => {
            if (!res.ok)
                return [];
            return res.json();
        }),
    });
    const { data: bookmarkedSessions = [] } = useQuery({
        queryKey: ["/api/bookmarked-sessions"],
    });
    const { data: customScenarios = [] } = useQuery({
        queryKey: ["/api/custom-scenarios"],
    });
    const { data: dailyCount } = useQuery({
        queryKey: ["/api/daily-count"],
    });
    // Mutations
    const createScenarioMutation = useMutation({
        mutationFn: async (scenario) => {
            const response = await fetch("/api/custom-scenarios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(scenario),
            });
            if (!response.ok)
                throw new Error("Failed to create scenario");
            return response.json();
        },
        onSuccess: () => {
            toast({ title: "シナリオを作成しました" });
            setNewScenario({ title: "", description: "" });
            queryClient.invalidateQueries({ queryKey: ["/api/custom-scenarios"] });
        },
    });
    const updateScenarioMutation = useMutation({
        mutationFn: async ({ id, ...scenario }) => {
            const response = await fetch(`/api/custom-scenarios/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(scenario),
            });
            if (!response.ok)
                throw new Error("Failed to update scenario");
            return response.json();
        },
        onSuccess: () => {
            toast({ title: "シナリオを更新しました" });
            setEditingScenario(null);
            queryClient.invalidateQueries({ queryKey: ["/api/custom-scenarios"] });
        },
    });
    const deleteScenarioMutation = useMutation({
        mutationFn: async (id) => {
            const response = await fetch(`/api/custom-scenarios/${id}`, {
                method: "DELETE",
            });
            if (!response.ok)
                throw new Error("Failed to delete scenario");
            return response.json();
        },
        onSuccess: () => {
            toast({ title: "シナリオを削除しました" });
            queryClient.invalidateQueries({ queryKey: ["/api/custom-scenarios"] });
        },
    });
    const createCustomerPortalMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest("POST", "/api/create-customer-portal", {});
            return response.json();
        },
        onSuccess: (data) => {
            window.location.href = data.url;
        },
        onError: () => {
            toast({
                title: "エラー",
                description: "カスタマーポータルの起動に失敗しました",
                variant: "destructive",
            });
        },
    });
    const upgradeSubscriptionMutation = useMutation({
        mutationFn: (planType) => apiRequest("/api/upgrade-subscription", "POST", { planType }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/user-subscription"] });
            toast({
                title: "アップグレード完了",
                description: data.message,
                variant: "default",
            });
        },
        onError: (error) => {
            console.error("Upgrade subscription error:", error);
            toast({
                title: "エラー",
                description: "アップグレードに失敗しました",
                variant: "destructive",
            });
        },
    });
    const handleUpgradeSubscription = (planType) => {
        upgradeSubscriptionMutation.mutate(planType);
    };
    const handleCreateScenario = () => {
        if (newScenario.title && newScenario.description) {
            createScenarioMutation.mutate(newScenario);
        }
    };
    const handleUpdateScenario = () => {
        if (editingScenario) {
            updateScenarioMutation.mutate(editingScenario);
        }
    };
    const handleDeleteScenario = (id) => {
        deleteScenarioMutation.mutate(id);
    };
    const getDifficultyName = (level) => {
        const names = {
            toeic: "TOEIC",
            "middle-school": "中学英語",
            "high-school": "高校英語",
            "basic-verbs": "基本動詞",
            "business-email": "ビジネスメール",
        };
        return names[level] || level;
    };
    const handleReviewProblem = (session) => {
        // Store the problem data in sessionStorage for the practice interface
        sessionStorage.setItem("reviewProblem", JSON.stringify({
            japaneseSentence: session.japaneseSentence,
            difficultyLevel: session.difficultyLevel,
            isReview: true,
        }));
        // Navigate to appropriate practice interface
        if (session.difficultyLevel.startsWith("simulation-")) {
            const scenarioId = session.difficultyLevel.replace("simulation-", "");
            setLocation(`/simulation-practice?scenario=${scenarioId}`);
        }
        else {
            // Navigate to home page with difficulty selection
            setLocation(`/?difficulty=${session.difficultyLevel}`);
        }
    };
    const handleRepeatPractice = () => {
        if (recentSessions.length === 0)
            return;
        // Store all recent sessions for repeat practice mode
        sessionStorage.setItem("repeatPracticeMode", "true");
        sessionStorage.setItem("repeatPracticeSessions", JSON.stringify(recentSessions));
        sessionStorage.setItem("repeatPracticeIndex", "0");
        // Start with the first session from recent sessions
        const firstSession = recentSessions[0];
        // Navigate to appropriate practice interface
        if (firstSession.difficultyLevel.startsWith("simulation-")) {
            const scenarioId = firstSession.difficultyLevel.replace("simulation-", "");
            setLocation(`/simulation-practice?scenario=${scenarioId}`);
        }
        else {
            setLocation(`/practice/${firstSession.difficultyLevel}`);
        }
    };
    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            toast({
                title: "ログアウト完了",
                description: "正常にログアウトしました",
            });
            setLocation("/");
        }
        catch (error) {
            toast({
                title: "ログアウトエラー",
                description: "ログアウト中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoggingOut(false);
        }
    };
    const formatProgressData = () => {
        return progressData.map((item) => ({
            date: new Date(item.date).toLocaleDateString("ja-JP", {
                month: "short",
                day: "numeric",
            }),
            problems: item.problemsCompleted,
            rating: item.averageRating,
        }));
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 p-4", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Link, { href: "/", children: _jsx(Button, { variant: "ghost", size: "sm", children: _jsx(ArrowLeft, { className: "w-4 h-4" }) }) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(User, { className: "w-6 h-6 text-blue-600" }), _jsx("h1", { className: "text-2xl font-bold", children: "\u30DE\u30A4\u30DA\u30FC\u30B8" })] })] }), _jsx(Link, { href: "/", children: _jsxs(Button, { variant: "outline", size: "sm", className: "bg-white shadow-md", children: [_jsx(Home, { className: "w-4 h-4 mr-2" }), "\u30C8\u30C3\u30D7\u30DA\u30FC\u30B8"] }) })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { className: "grid w-full grid-cols-5", children: [_jsx(TabsTrigger, { value: "progress", children: "\u9032\u6357\u30EC\u30DD\u30FC\u30C8" }), _jsx(TabsTrigger, { value: "bookmarks", children: "\u30D6\u30C3\u30AF\u30DE\u30FC\u30AF" }), _jsx(TabsTrigger, { value: "review", children: "\u632F\u308A\u8FD4\u308A\u6A5F\u80FD" }), _jsx(TabsTrigger, { value: "scenarios", children: "\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3" }), _jsx(TabsTrigger, { value: "account", children: "\u30A2\u30AB\u30A6\u30F3\u30C8" })] }), _jsxs(TabsContent, { value: "progress", className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "\u9023\u7D9A\u5B66\u7FD2\u65E5\u6570" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold text-green-600", children: [streakData?.streak || 0, "\u65E5"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "\u9023\u7D9A\u9054\u6210\u4E2D\uFF01" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "\u4ECA\u6708\u306E\u554F\u984C\u6570" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold text-blue-600", children: [monthlyStats?.totalProblems || 0, "\u554F"] }), _jsx("p", { className: "text-xs text-muted-foreground mt-2", children: "\u4ECA\u6708\u306E\u5B9F\u7E3E" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "\u5E73\u5747\u2605\u8A55\u4FA1" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold text-yellow-600", children: ["\u2605", monthlyStats?.averageRating || 0] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "\u4ECA\u6708\u306E\u5E73\u5747" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "\u4ECA\u65E5\u306E\u554F\u984C\u6570" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold text-orange-600", children: [dailyCount?.count || 0, "/100"] }), _jsx(Progress, { value: dailyCount?.count || 0, className: "mt-2" }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: ["\u6B8B\u308A ", dailyCount?.remaining || 100, "\u554F"] })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-5 h-5" }), "\u6B63\u7B54\u7387\u306E\u63A8\u79FB"] }), _jsx("div", { className: "flex gap-2", children: ["day", "week", "month"].map((period) => (_jsx(Button, { variant: selectedPeriod === period ? "default" : "outline", size: "sm", onClick: () => setSelectedPeriod(period), children: period === "day"
                                                            ? "日"
                                                            : period === "week"
                                                                ? "週"
                                                                : "月" }, period))) })] }), _jsx(CardContent, { children: _jsx("div", { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: formatProgressData(), children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, { yAxisId: "left" }), _jsx(YAxis, { yAxisId: "right", orientation: "right" }), _jsx(Tooltip, {}), _jsx(Bar, { yAxisId: "left", dataKey: "problems", fill: "#3b82f6", name: "\u554F\u984C\u6570" }), _jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "rating", stroke: "#f59e0b", name: "\u2605\u8A55\u4FA1" })] }) }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\u30EC\u30D9\u30EB\u5225\u9032\u6357" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: difficultyStats.map((stat) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: getDifficultyName(stat.difficulty) }), _jsxs("div", { className: "text-sm text-muted-foreground", children: [stat.count, "\u554F\u5B8C\u4E86"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-sm", children: ["\u2605", stat.averageRating] }), _jsx(Badge, { variant: stat.averageRating >= 4 ? "default" : "secondary", children: stat.averageRating >= 4 ? "優秀" : "要改善" })] })] }, stat.difficulty))) }) })] })] }), _jsx(TabsContent, { value: "bookmarks", className: "space-y-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Bookmark, { className: "w-5 h-5 text-blue-500" }), "\u30D6\u30C3\u30AF\u30DE\u30FC\u30AF\u3057\u305F\u554F\u984C"] }), _jsx(CardDescription, { children: "\u91CD\u8981\u306A\u554F\u984C\u3084\u5FA9\u7FD2\u3057\u305F\u3044\u554F\u984C\u3092\u30D6\u30C3\u30AF\u30DE\u30FC\u30AF\u3057\u3066\u7BA1\u7406" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3 max-h-96 overflow-y-auto", children: bookmarkedSessions.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [_jsx(Bookmark, { className: "w-12 h-12 mx-auto mb-3 text-gray-300" }), _jsx("p", { children: "\u30D6\u30C3\u30AF\u30DE\u30FC\u30AF\u3057\u305F\u554F\u984C\u304C\u3042\u308A\u307E\u305B\u3093" }), _jsx("p", { className: "text-sm mt-1", children: "\u7DF4\u7FD2\u4E2D\u306B\u91CD\u8981\u306A\u554F\u984C\u3092\u30D6\u30C3\u30AF\u30DE\u30FC\u30AF\u3057\u3066\u307F\u307E\u3057\u3087\u3046" })] })) : (bookmarkedSessions.map((session) => (_jsx("div", { className: "p-4 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors", onClick: () => handleReviewProblem(session), children: _jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium text-gray-900 mb-1", children: session.japaneseSentence }), _jsxs("div", { className: "text-sm text-gray-600 mb-2", children: ["\u524D\u56DE\u306E\u56DE\u7B54: ", session.userTranslation] }), _jsxs("div", { className: "text-sm text-green-700 mb-2", children: [_jsx("strong", { children: "\u6A21\u7BC4\u89E3\u7B54:" }), " ", session.correctTranslation] }), _jsxs("div", { className: "flex items-center gap-4 text-xs text-muted-foreground", children: [_jsx("span", { children: getDifficultyName(session.difficultyLevel) }), _jsx("span", { children: new Date(session.createdAt).toLocaleDateString("ja-JP") })] })] }), _jsxs("div", { className: "flex items-center gap-2 ml-4", children: [_jsxs("div", { className: "flex items-center gap-1", children: [Array.from({ length: session.rating }).map((_, i) => (_jsx(Star, { className: "w-3 h-3 fill-yellow-400 text-yellow-400" }, i))), Array.from({ length: 5 - session.rating }).map((_, i) => (_jsx(Star, { className: "w-3 h-3 text-gray-300" }, i)))] }), _jsx(ArrowRight, { className: "w-4 h-4 text-blue-600" })] })] }) }, session.id)))) }) })] }) }), _jsxs(TabsContent, { value: "review", className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(RefreshCw, { className: "w-5 h-5 text-blue-500" }), "\u7E70\u308A\u8FD4\u3057\u7DF4\u7FD2"] }), _jsx(CardDescription, { children: "\u904E\u53BB1\u9031\u9593\u306B\u89E3\u3044\u305F\u554F\u984C\u3092\u30E9\u30F3\u30C0\u30E0\u306B\u7DF4\u7FD2\u3067\u304D\u307E\u3059\u3002\u5FA9\u7FD2\u306B\u6700\u9069\u3067\u3059\u3002" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-center space-y-4", children: recentSessions.length === 0 ? (_jsxs("div", { className: "py-8 text-gray-500", children: [_jsx(RefreshCw, { className: "w-12 h-12 mx-auto mb-3 text-gray-300" }), _jsx("p", { className: "text-sm", children: "\u76F4\u8FD11\u9031\u9593\u306E\u7DF4\u7FD2\u5C65\u6B74\u304C\u3042\u308A\u307E\u305B\u3093" }), _jsx("p", { className: "text-sm mt-1", children: "\u7DF4\u7FD2\u3092\u958B\u59CB\u3057\u3066\u5C65\u6B74\u3092\u84C4\u7A4D\u3057\u307E\u3057\u3087\u3046" })] })) : (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "text-sm text-muted-foreground", children: ["\u904E\u53BB1\u9031\u9593\u3067 ", recentSessions.length, " \u554F\u306E\u5C65\u6B74\u304C\u3042\u308A\u307E\u3059"] }), subscription?.subscriptionType === "premium" ? (_jsxs(Button, { onClick: () => handleRepeatPractice(), className: "w-full", size: "lg", children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2" }), "\u7E70\u308A\u8FD4\u3057\u7DF4\u7FD2\u3092\u958B\u59CB"] })) : (_jsxs("div", { className: "space-y-3", children: [_jsxs(Button, { className: "w-full", size: "lg", disabled: true, children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2" }), "\u7E70\u308A\u8FD4\u3057\u7DF4\u7FD2\u3092\u958B\u59CB"] }), _jsxs("div", { className: "p-4 bg-yellow-50 border border-yellow-200 rounded-lg", children: [_jsx("p", { className: "text-sm text-yellow-800 mb-2", children: _jsx("strong", { children: "\u3053\u306E\u6A5F\u80FD\u306F\u30D7\u30EC\u30DF\u30A2\u30E0\u30D7\u30E9\u30F3\u9650\u5B9A\u3067\u3059\u3002" }) }), _jsx("p", { className: "text-sm text-yellow-700", children: "\u7E70\u308A\u8FD4\u3059\u3060\u3051\u3067\u3001\u30D5\u30EC\u30FC\u30BA\u304C\u5B9A\u7740\u3057\u3001\u78BA\u5B9F\u306B\u8A71\u305B\u308B\u82F1\u8A9E\u304C\u5897\u3048\u3066\u3044\u304D\u307E\u3059\u3002" })] })] }))] })) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(RotateCcw, { className: "w-5 h-5 text-red-500" }), "\u8981\u5FA9\u7FD2\u30EA\u30B9\u30C8\uFF08\u26052\u4EE5\u4E0B\uFF09"] }), _jsx(CardDescription, { children: "\u8A55\u4FA1\u304C\u4F4E\u3044\u554F\u984C\u3092\u5FA9\u7FD2\u3057\u307E\u3057\u3087\u3046\u3002\u30AF\u30EA\u30C3\u30AF\u3057\u3066\u518D\u6311\u6226\u3067\u304D\u307E\u3059\u3002" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3 max-h-60 overflow-y-auto", children: reviewSessions.map((session) => (_jsx("div", { className: "p-3 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors", onClick: () => handleReviewProblem(session), children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-medium", children: session.japaneseSentence }), _jsx("div", { className: "text-xs text-muted-foreground mt-1", children: getDifficultyName(session.difficultyLevel) })] }), _jsx("div", { className: "text-blue-600", children: _jsx(ArrowRight, { className: "w-4 h-4" }) })] }) }, session.id))) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-orange-500" }), "\u518D\u6311\u6226\u30EA\u30B9\u30C8\uFF08\u26053\uFF09"] }), _jsx(CardDescription, { children: "\u3082\u3046\u4E00\u5EA6\u30C1\u30E3\u30EC\u30F3\u30B8\u3057\u3066\u30B9\u30B3\u30A2\u30A2\u30C3\u30D7\u3092\u76EE\u6307\u3057\u307E\u3057\u3087\u3046\u3002\u30AF\u30EA\u30C3\u30AF\u3057\u3066\u518D\u6311\u6226\u3067\u304D\u307E\u3059\u3002" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3 max-h-60 overflow-y-auto", children: rechallengeList.map((session) => (_jsx("div", { className: "p-3 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors", onClick: () => handleReviewProblem(session), children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-medium", children: session.japaneseSentence }), _jsx("div", { className: "text-xs text-muted-foreground mt-1", children: getDifficultyName(session.difficultyLevel) })] }), _jsx("div", { className: "text-blue-600", children: _jsx(ArrowRight, { className: "w-4 h-4" }) })] }) }, session.id))) }) })] })] }), _jsx(TabsContent, { value: "scenarios", className: "space-y-6", children: !canAccessPremiumFeatures ? (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Plus, { className: "w-5 h-5" }), "\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u4F5C\u6210"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-center py-12", children: _jsxs("div", { className: "p-4 bg-yellow-50 border border-yellow-200 rounded-lg", children: [_jsx("p", { className: "text-sm text-yellow-800 mb-2", children: _jsx("strong", { children: "\u3053\u306E\u6A5F\u80FD\u306F\u30D7\u30EC\u30DF\u30A2\u30E0\u30D7\u30E9\u30F3\u9650\u5B9A\u3067\u3059\u3002" }) }), _jsx("p", { className: "text-sm text-yellow-700", children: "\u30EA\u30A2\u30EB\u306A\u30D3\u30B8\u30CD\u30B9\u30B7\u30FC\u30F3\u3092\u60F3\u5B9A\u3057\u305F\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u7DF4\u7FD2\u3092\u4F53\u9A13\u3057\u305F\u3044\u65B9\u306F\u3001\u30D7\u30EC\u30DF\u30A2\u30E0\u30D7\u30E9\u30F3\u3092\u3054\u691C\u8A0E\u304F\u3060\u3055\u3044\u3002" })] }) }) })] })) : (_jsxs(_Fragment, { children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Plus, { className: "w-5 h-5" }), "\u65B0\u3057\u3044\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u4F5C\u6210"] }), _jsx(CardDescription, { children: "\u81EA\u5206\u3060\u3051\u306E\u30AA\u30EA\u30B8\u30CA\u30EB\u82F1\u8A9E\u7DF4\u7FD2\u30B7\u30FC\u30F3\u3092\u4F5C\u6210" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "title", children: "\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u30BF\u30A4\u30C8\u30EB" }), _jsx(Input, { id: "title", placeholder: "\u4F8B\uFF1A\u4E0A\u53F8\u306B\u82F1\u8A9E\u3067\u5831\u544A\u3059\u308B\u5834\u9762", value: newScenario.title, onChange: (e) => setNewScenario({
                                                                    ...newScenario,
                                                                    title: e.target.value,
                                                                }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "description", children: "\u8A73\u7D30\u8AAC\u660E" }), _jsx(Textarea, { id: "description", placeholder: "\u4F8B\uFF1A\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u9032\u6357\u3092\u4E0A\u53F8\u306B\u82F1\u8A9E\u3067\u5831\u544A\u3059\u308B\u969B\u306B\u4F7F\u3048\u308B\u8868\u73FE\u3092\u7DF4\u7FD2\u3057\u307E\u3059\u3002\u5831\u544A\u5185\u5BB9\u306B\u306F\u6210\u679C\u3001\u8AB2\u984C\u3001\u4ECA\u5F8C\u306E\u4E88\u5B9A\u3092\u542B\u3081\u3066\u304F\u3060\u3055\u3044\u3002", value: newScenario.description, onChange: (e) => setNewScenario({
                                                                    ...newScenario,
                                                                    description: e.target.value,
                                                                }), rows: 4 })] }), _jsx(Button, { onClick: handleCreateScenario, disabled: createScenarioMutation.isPending ||
                                                            !newScenario.title ||
                                                            !newScenario.description, children: "\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3092\u4F5C\u6210" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "\u4F5C\u6210\u6E08\u307F\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3" }), _jsx(CardDescription, { children: "\u30B7\u30CA\u30EA\u30AA\u3092\u7DE8\u96C6\u3059\u308B\u304B\u3001\u300C\u7DF4\u7FD2\u958B\u59CB\u300D\u3067\u5B9F\u969B\u306B\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u7DF4\u7FD2\u304C\u3067\u304D\u307E\u3059" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: customScenarios.map((scenario) => (_jsx("div", { className: "p-4 border rounded-lg", children: editingScenario?.id === scenario.id ? (_jsxs("div", { className: "space-y-3", children: [_jsx(Input, { value: editingScenario.title, onChange: (e) => setEditingScenario({
                                                                        ...editingScenario,
                                                                        title: e.target.value,
                                                                    }) }), _jsx(Textarea, { value: editingScenario.description, onChange: (e) => setEditingScenario({
                                                                        ...editingScenario,
                                                                        description: e.target.value,
                                                                    }), rows: 3 }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", onClick: handleUpdateScenario, children: "\u4FDD\u5B58" }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => setEditingScenario(null), children: "\u30AD\u30E3\u30F3\u30BB\u30EB" })] })] })) : (_jsx("div", { children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-medium", children: scenario.title }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: scenario.description }), _jsxs("div", { className: "text-xs text-muted-foreground mt-2", children: ["\u4F5C\u6210\u65E5:", " ", new Date(scenario.createdAt).toLocaleDateString("ja-JP")] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "default", onClick: () => (window.location.href = `/simulation/${scenario.id}`), children: "\u7DF4\u7FD2\u958B\u59CB" }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => setEditingScenario(scenario), children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => handleDeleteScenario(scenario.id), children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }) })) }, scenario.id))) }) })] })] })) }), _jsxs(TabsContent, { value: "account", className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Settings, { className: "w-5 h-5 text-blue-500" }), "\u73FE\u5728\u306E\u30D7\u30E9\u30F3"] }), _jsx(CardDescription, { children: "\u3054\u5229\u7528\u4E2D\u306E\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u30D7\u30E9\u30F3\u306E\u8A73\u7D30\u60C5\u5831" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [subscription?.subscriptionType === "premium" ? (_jsx(Crown, { className: "w-6 h-6 text-purple-600" })) : (_jsx(User, { className: "w-6 h-6 text-blue-600" })), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg", children: subscription?.subscriptionStatus === "trialing"
                                                                                    ? `${subscription?.subscriptionType === "premium" ? "プレミアム" : "スタンダード"}プラン（トライアル中）`
                                                                                    : subscription?.subscriptionType === "premium"
                                                                                        ? "プレミアムプラン"
                                                                                        : "スタンダードプラン" }), _jsx("p", { className: "text-sm text-gray-600", children: subscription?.subscriptionType === "premium" &&
                                                                                    subscription?.subscriptionStatus === "trialing"
                                                                                    ? "全機能・無制限アクセス（トライアル中）"
                                                                                    : subscription?.subscriptionType === "premium"
                                                                                        ? "全機能・無制限アクセス"
                                                                                        : subscription?.subscriptionStatus === "trialing"
                                                                                            ? "基本機能・50問/日（トライアル中）"
                                                                                            : "基本機能・50問/日" })] })] }), _jsx("div", { className: "text-right", children: _jsx(Badge, { variant: subscription?.subscriptionType === "premium"
                                                                        ? "default"
                                                                        : "secondary", children: subscription?.subscriptionType === "premium"
                                                                        ? "プレミアム"
                                                                        : "スタンダード" }) })] }), subscription?.subscriptionStatus === "trialing" &&
                                                        subscription?.trialStart && (_jsxs("div", { className: "p-4 bg-green-50 border border-green-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Calendar, { className: "w-4 h-4 text-green-600" }), _jsxs("span", { className: "font-medium text-green-800", children: ["\u7121\u6599\u30C8\u30E9\u30A4\u30A2\u30EB\u4E2D\uFF08\u6B8B\u308A", Math.max(0, 7 -
                                                                                Math.floor((Date.now() -
                                                                                    new Date(subscription.trialStart).getTime()) /
                                                                                    (1000 * 60 * 60 * 24))), "\u65E5\uFF09"] })] }), _jsxs("p", { className: "text-sm text-green-700", children: ["\u30C8\u30E9\u30A4\u30A2\u30EB\u671F\u9593\u7D42\u4E86\u5F8C\u3001\u81EA\u52D5\u7684\u306B", subscription?.subscriptionType === "premium"
                                                                        ? "プレミアムプラン（月額1,300円）"
                                                                        : "スタンダードプラン（月額980円）", "\u306B\u79FB\u884C\u3055\u308C\u307E\u3059\u3002"] })] }))] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(CreditCard, { className: "w-5 h-5 text-green-500" }), "\u30D7\u30E9\u30F3\u5909\u66F4"] }), _jsx(CardDescription, { children: "\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u30D7\u30E9\u30F3\u306E\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9\u30FB\u30C0\u30A6\u30F3\u30B0\u30EC\u30FC\u30C9" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [subscription?.subscriptionType === "standard" ? (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "p-4 border rounded-lg", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium", children: "\u30D7\u30EC\u30DF\u30A2\u30E0\u6708\u984D\u30D7\u30E9\u30F3\u306B\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "\u7121\u5236\u9650\u554F\u984C\u3001\u30AB\u30B9\u30BF\u30E0\u30B7\u30CA\u30EA\u30AA\u3001\u8A73\u7D30\u5206\u6790\u6A5F\u80FD\uFF08\u65E5\u5272\u308A\u8A08\u7B97\u3067\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9\uFF09" })] }), _jsxs(Button, { className: "bg-purple-600 hover:bg-purple-700", onClick: () => handleUpgradeSubscription("monthly"), disabled: upgradeSubscriptionMutation.isPending, children: [_jsx(Crown, { className: "w-4 h-4 mr-2" }), upgradeSubscriptionMutation.isPending
                                                                                    ? "処理中..."
                                                                                    : "月額にアップグレード"] })] }) }), _jsx("div", { className: "p-4 border rounded-lg", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium", children: "\u30D7\u30EC\u30DF\u30A2\u30E0\u5E74\u9593\u30D7\u30E9\u30F3\u306B\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "2\u30F6\u6708\u5206\u304A\u5F97\u3001\u7121\u5236\u9650\u554F\u984C\u3001\u30AB\u30B9\u30BF\u30E0\u30B7\u30CA\u30EA\u30AA\uFF08\u65E5\u5272\u308A\u8A08\u7B97\u3067\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9\uFF09" })] }), _jsxs(Button, { className: "bg-purple-600 hover:bg-purple-700", onClick: () => handleUpgradeSubscription("yearly"), disabled: upgradeSubscriptionMutation.isPending, children: [_jsx(Crown, { className: "w-4 h-4 mr-2" }), upgradeSubscriptionMutation.isPending
                                                                                    ? "処理中..."
                                                                                    : "年間にアップグレード"] })] }) })] })) : (_jsx("div", { className: "p-4 border rounded-lg", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium", children: "\u30B9\u30BF\u30F3\u30C0\u30FC\u30C9\u30D7\u30E9\u30F3\u306B\u30C0\u30A6\u30F3\u30B0\u30EC\u30FC\u30C9" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "\u57FA\u672C\u6A5F\u80FD\u306E\u307F\u5229\u7528\uFF08\u6B21\u56DE\u8ACB\u6C42\u6642\u304B\u3089\u9069\u7528\uFF09" })] }), _jsx(Button, { variant: "outline", onClick: () => createCustomerPortalMutation.mutate(), disabled: createCustomerPortalMutation.isPending, children: createCustomerPortalMutation.isPending
                                                                        ? "処理中..."
                                                                        : "ダウングレード" })] }) })), _jsx("div", { className: "p-4 border rounded-lg", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium", children: "\u5E74\u4F1A\u8CBB\u30D7\u30E9\u30F3\u306B\u5909\u66F4" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "\u6708\u984D\u30D7\u30E9\u30F3\u3088\u308A2\u30F6\u6708\u5206\u304A\u5F97" })] }), _jsx(Button, { variant: "outline", onClick: () => createCustomerPortalMutation.mutate(), disabled: createCustomerPortalMutation.isPending, children: createCustomerPortalMutation.isPending
                                                                        ? "処理中..."
                                                                        : "年会費に変更" })] }) })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-purple-500" }), "\u30D7\u30E9\u30F3\u6BD4\u8F03"] }), _jsx(CardDescription, { children: "\u30B9\u30BF\u30F3\u30C0\u30FC\u30C9\u30D7\u30E9\u30F3\u3068\u30D7\u30EC\u30DF\u30A2\u30E0\u30D7\u30E9\u30F3\u306E\u6A5F\u80FD\u6BD4\u8F03" })] }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full border-collapse border border-gray-200 rounded-lg", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-50", children: [_jsx("th", { className: "border border-gray-200 px-4 py-3 text-left font-medium text-gray-900", children: "\u6A5F\u80FD" }), _jsx("th", { className: "border border-gray-200 px-4 py-3 text-center font-medium text-gray-900", children: "\u30B9\u30BF\u30F3\u30C0\u30FC\u30C9\u30D7\u30E9\u30F3" }), _jsx("th", { className: "border border-gray-200 px-4 py-3 text-center font-medium text-gray-900", children: "\u30D7\u30EC\u30DF\u30A2\u30E0\u30D7\u30E9\u30F3" })] }) }), _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { className: "border border-gray-200 px-4 py-3 font-medium", children: "\u6708\u984D\u6599\u91D1" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center font-medium", children: "980\u5186" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center font-medium", children: "1,300\u5186" })] }), _jsxs("tr", { className: "bg-gray-50/50", children: [_jsx("td", { className: "border border-gray-200 px-4 py-3 font-medium", children: "\u5E74\u4F1A\u8CBB (2\u30F6\u6708\u5206\u304A\u5F97)" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center font-medium", children: "9,800\u5186" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center font-medium", children: "13,000\u5186" })] }), _jsxs("tr", { children: [_jsx("td", { className: "border border-gray-200 px-4 py-3 font-medium", children: "\u57FA\u672C\u7DF4\u7FD2\u6A5F\u80FD" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center text-green-600", children: "\u2713" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center text-green-600", children: "\u2713" })] }), _jsxs("tr", { className: "bg-gray-50/50", children: [_jsx("td", { className: "border border-gray-200 px-4 py-3 font-medium", children: "1\u65E5\u306E\u7DF4\u7FD2\u554F\u984C\u4E0A\u9650" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center", children: "50\u554F" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center", children: "100\u554F" })] }), _jsxs("tr", { children: [_jsx("td", { className: "border border-gray-200 px-4 py-3 font-medium", children: "\u7E70\u308A\u8FD4\u3057\u7DF4\u7FD2" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center text-red-500", children: "\u2717" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center text-green-600", children: "\u2713" })] }), _jsxs("tr", { className: "bg-gray-50/50", children: [_jsx("td", { className: "border border-gray-200 px-4 py-3 font-medium", children: "\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u7DF4\u7FD2" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center text-red-500", children: "\u2717" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center text-green-600", children: "\u2713" })] }), _jsxs("tr", { children: [_jsx("td", { className: "border border-gray-200 px-4 py-3 font-medium", children: "\u9032\u6357\u30EC\u30DD\u30FC\u30C8" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center text-green-600", children: "\u2713" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center text-green-600", children: "\u2713" })] }), _jsxs("tr", { className: "bg-gray-50/50", children: [_jsx("td", { className: "border border-gray-200 px-4 py-3 font-medium", children: "\u30D6\u30C3\u30AF\u30DE\u30FC\u30AF\u6A5F\u80FD" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center text-green-600", children: "\u2713" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center text-green-600", children: "\u2713" })] }), _jsxs("tr", { children: [_jsx("td", { className: "border border-gray-200 px-4 py-3 font-medium", children: "\u97F3\u58F0\u8AAD\u307F\u4E0A\u3052" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center text-green-600", children: "\u2713" }), _jsx("td", { className: "border border-gray-200 px-4 py-3 text-center text-green-600", children: "\u2713" })] })] })] }) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(CreditCard, { className: "w-5 h-5 text-orange-500" }), "\u652F\u6255\u3044\u7BA1\u7406"] }), _jsx(CardDescription, { children: "\u8ACB\u6C42\u60C5\u5831\u306E\u78BA\u8A8D\u3068\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u306E\u7BA1\u7406" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 border rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h4", { className: "font-medium", children: "\u6B21\u56DE\u8ACB\u6C42\u65E5" }), _jsx("span", { className: "text-sm text-gray-600", children: (() => {
                                                                            const trialEndDate = new Date();
                                                                            trialEndDate.setDate(trialEndDate.getDate() + 7); // 7日間のトライアル
                                                                            return trialEndDate.toLocaleDateString("ja-JP");
                                                                        })() })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h4", { className: "font-medium", children: "\u8ACB\u6C42\u91D1\u984D" }), _jsx("span", { className: "text-lg font-bold", children: "\u6708\u984D1,300\u5186" })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs(Button, { variant: "outline", className: "flex-1", onClick: () => createCustomerPortalMutation.mutate(), disabled: createCustomerPortalMutation.isPending, children: [_jsx(ExternalLink, { className: "w-4 h-4 mr-2" }), createCustomerPortalMutation.isPending
                                                                        ? "処理中..."
                                                                        : "請求履歴を確認"] }), _jsxs(Button, { variant: "outline", className: "flex-1", onClick: () => createCustomerPortalMutation.mutate(), disabled: createCustomerPortalMutation.isPending, children: [_jsx(CreditCard, { className: "w-4 h-4 mr-2" }), createCustomerPortalMutation.isPending
                                                                        ? "処理中..."
                                                                        : "支払い方法を変更"] })] }), _jsxs("div", { className: "pt-4 border-t", children: [_jsx(Button, { variant: "destructive", className: "w-full", onClick: () => createCustomerPortalMutation.mutate(), disabled: createCustomerPortalMutation.isPending, children: createCustomerPortalMutation.isPending
                                                                    ? "処理中..."
                                                                    : "サブスクリプションを解約" }), _jsx("p", { className: "text-xs text-gray-500 mt-2 text-center", children: "\u89E3\u7D04\u5F8C\u3082\u73FE\u5728\u306E\u8ACB\u6C42\u671F\u9593\u7D42\u4E86\u307E\u3067\u306F\u3054\u5229\u7528\u3044\u305F\u3060\u3051\u307E\u3059" })] })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(User, { className: "w-5 h-5 text-green-500" }), "\u30A2\u30AB\u30A6\u30F3\u30C8\u60C5\u5831"] }), _jsx(CardDescription, { children: "\u30ED\u30B0\u30A4\u30F3\u60C5\u5831\u3068\u30A2\u30AB\u30A6\u30F3\u30C8\u7BA1\u7406" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center", children: _jsx(User, { className: "w-6 h-6 text-white" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-semibold", children: user?.email }), isAdmin && (_jsx(Shield, { className: "w-4 h-4 text-orange-500" }))] }), _jsx("p", { className: "text-sm text-gray-600", children: isAdmin ? "管理者アカウント" : "ユーザーアカウント" })] })] }), _jsxs("div", { className: "text-right text-sm text-gray-600", children: [_jsx("p", { children: "\u767B\u9332\u65E5" }), _jsx("p", { children: user?.created_at
                                                                            ? new Date(user.created_at).toLocaleDateString("ja-JP")
                                                                            : "-" })] })] }), _jsxs("div", { className: "pt-4 border-t", children: [_jsxs(Button, { variant: "outline", className: "w-full border-red-200 text-red-600 hover:bg-red-50", onClick: handleLogout, disabled: isLoggingOut, children: [_jsx(LogOut, { className: "w-4 h-4 mr-2" }), isLoggingOut ? "ログアウト中..." : "ログアウト"] }), _jsx("p", { className: "text-xs text-gray-500 mt-2 text-center", children: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u7D42\u4E86\u3057\u3066\u30C8\u30C3\u30D7\u30DA\u30FC\u30B8\u306B\u623B\u308A\u307E\u3059" })] })] }) })] })] })] })] }) }));
}
