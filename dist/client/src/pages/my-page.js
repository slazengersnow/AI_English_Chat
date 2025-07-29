"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MyPage;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const useSubscription_1 = require("@/hooks/useSubscription");
const auth_provider_1 = require("@/components/auth-provider");
const card_1 = require("@/components/ui/card");
const tabs_1 = require("@/components/ui/tabs");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const badge_1 = require("@/components/ui/badge");
const progress_1 = require("@/components/ui/progress");
const textarea_1 = require("@/components/ui/textarea");
const recharts_1 = require("recharts");
const lucide_react_1 = require("lucide-react");
const queryClient_1 = require("@/lib/queryClient");
const use_toast_1 = require("@/hooks/use-toast");
const wouter_1 = require("wouter");
const wouter_2 = require("wouter");
function MyPage() {
    const [, setLocation] = (0, wouter_1.useLocation)();
    const { toast } = (0, use_toast_1.useToast)();
    const { user, isAdmin, signOut } = (0, auth_provider_1.useAuth)();
    const [isLoggingOut, setIsLoggingOut] = (0, react_1.useState)(false);
    // Check URL for tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get("tab");
    const [activeTab, setActiveTab] = (0, react_1.useState)(tabFromUrl || "progress");
    const [selectedPeriod, setSelectedPeriod] = (0, react_1.useState)("week");
    const [newScenario, setNewScenario] = (0, react_1.useState)({
        title: "",
        description: "",
    });
    const [editingScenario, setEditingScenario] = (0, react_1.useState)(null);
    const { subscription, canAccessPremiumFeatures } = (0, useSubscription_1.useSubscription)();
    // API queries
    const { data: progressData = [] } = (0, react_query_1.useQuery)({
        queryKey: ["/api/progress", selectedPeriod],
    });
    const { data: streakData } = (0, react_query_1.useQuery)({
        queryKey: ["/api/streak"],
    });
    const { data: difficultyStats = [] } = (0, react_query_1.useQuery)({
        queryKey: ["/api/difficulty-stats"],
    });
    const { data: monthlyStats } = (0, react_query_1.useQuery)({
        queryKey: ["/api/monthly-stats"],
    });
    const { data: reviewSessions = [] } = (0, react_query_1.useQuery)({
        queryKey: ["/api/review-sessions"],
    });
    // Recent sessions (past week)
    const { data: recentSessions = [] } = (0, react_query_1.useQuery)({
        queryKey: ["/api/recent-sessions"],
    });
    // Subscription details for account tab
    const { data: subscriptionDetails } = (0, react_query_1.useQuery)({
        queryKey: ["/api/subscription-details"],
        enabled: activeTab === "account",
    });
    const { data: rechallengeList = [] } = (0, react_query_1.useQuery)({
        queryKey: ["/api/review-sessions", { threshold: 3 }],
        queryFn: () => fetch("/api/review-sessions?threshold=3").then((res) => {
            if (!res.ok)
                return [];
            return res.json();
        }),
    });
    const { data: bookmarkedSessions = [] } = (0, react_query_1.useQuery)({
        queryKey: ["/api/bookmarked-sessions"],
    });
    const { data: customScenarios = [] } = (0, react_query_1.useQuery)({
        queryKey: ["/api/custom-scenarios"],
    });
    const { data: dailyCount } = (0, react_query_1.useQuery)({
        queryKey: ["/api/daily-count"],
    });
    // Mutations
    const createScenarioMutation = (0, react_query_1.useMutation)({
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
            queryClient_1.queryClient.invalidateQueries({ queryKey: ["/api/custom-scenarios"] });
        },
    });
    const updateScenarioMutation = (0, react_query_1.useMutation)({
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
            queryClient_1.queryClient.invalidateQueries({ queryKey: ["/api/custom-scenarios"] });
        },
    });
    const deleteScenarioMutation = (0, react_query_1.useMutation)({
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
            queryClient_1.queryClient.invalidateQueries({ queryKey: ["/api/custom-scenarios"] });
        },
    });
    const createCustomerPortalMutation = (0, react_query_1.useMutation)({
        mutationFn: async () => {
            const response = await (0, queryClient_1.apiRequest)("POST", "/api/create-customer-portal", {});
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
    const upgradeSubscriptionMutation = (0, react_query_1.useMutation)({
        mutationFn: (planType) => (0, queryClient_1.apiRequest)("/api/upgrade-subscription", "POST", { planType }),
        onSuccess: (data) => {
            queryClient_1.queryClient.invalidateQueries({ queryKey: ["/api/user-subscription"] });
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
    return (<div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <wouter_2.Link href="/">
              <button_1.Button variant="ghost" size="sm">
                <lucide_react_1.ArrowLeft className="w-4 h-4"/>
              </button_1.Button>
            </wouter_2.Link>
            <div className="flex items-center gap-2">
              <lucide_react_1.User className="w-6 h-6 text-blue-600"/>
              <h1 className="text-2xl font-bold">マイページ</h1>
            </div>
          </div>
          <wouter_2.Link href="/">
            <button_1.Button variant="outline" size="sm" className="bg-white shadow-md">
              <lucide_react_1.Home className="w-4 h-4 mr-2"/>
              トップページ
            </button_1.Button>
          </wouter_2.Link>
        </div>

        <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
          <tabs_1.TabsList className="grid w-full grid-cols-5">
            <tabs_1.TabsTrigger value="progress">進捗レポート</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="bookmarks">ブックマーク</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="review">振り返り機能</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="scenarios">シミュレーション</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="account">アカウント</tabs_1.TabsTrigger>
          </tabs_1.TabsList>

          {/* 進捗レポート */}
          <tabs_1.TabsContent value="progress" className="space-y-6">
            {/* 統計情報 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <card_1.Card>
                <card_1.CardHeader className="pb-2">
                  <card_1.CardTitle className="text-sm font-medium">
                    連続学習日数
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {streakData?.streak || 0}日
                  </div>
                  <p className="text-xs text-muted-foreground">連続達成中！</p>
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardHeader className="pb-2">
                  <card_1.CardTitle className="text-sm font-medium">
                    今月の問題数
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {monthlyStats?.totalProblems || 0}問
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    今月の実績
                  </p>
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardHeader className="pb-2">
                  <card_1.CardTitle className="text-sm font-medium">
                    平均★評価
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    ★{monthlyStats?.averageRating || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">今月の平均</p>
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardHeader className="pb-2">
                  <card_1.CardTitle className="text-sm font-medium">
                    今日の問題数
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {dailyCount?.count || 0}/100
                  </div>
                  <progress_1.Progress value={dailyCount?.count || 0} className="mt-2"/>
                  <p className="text-xs text-muted-foreground mt-1">
                    残り {dailyCount?.remaining || 100}問
                  </p>
                </card_1.CardContent>
              </card_1.Card>
            </div>

            {/* 進捗グラフ */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.TrendingUp className="w-5 h-5"/>
                  正答率の推移
                </card_1.CardTitle>
                <div className="flex gap-2">
                  {["day", "week", "month"].map((period) => (<button_1.Button key={period} variant={selectedPeriod === period ? "default" : "outline"} size="sm" onClick={() => setSelectedPeriod(period)}>
                      {period === "day"
                ? "日"
                : period === "week"
                    ? "週"
                    : "月"}
                    </button_1.Button>))}
                </div>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="h-80">
                  <recharts_1.ResponsiveContainer width="100%" height="100%">
                    <recharts_1.LineChart data={formatProgressData()}>
                      <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                      <recharts_1.XAxis dataKey="date"/>
                      <recharts_1.YAxis yAxisId="left"/>
                      <recharts_1.YAxis yAxisId="right" orientation="right"/>
                      <recharts_1.Tooltip />
                      <recharts_1.Bar yAxisId="left" dataKey="problems" fill="#3b82f6" name="問題数"/>
                      <recharts_1.Line yAxisId="right" type="monotone" dataKey="rating" stroke="#f59e0b" name="★評価"/>
                    </recharts_1.LineChart>
                  </recharts_1.ResponsiveContainer>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* レベル別進捗 */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>レベル別進捗</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  {difficultyStats.map((stat) => (<div key={stat.difficulty} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {getDifficultyName(stat.difficulty)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stat.count}問完了
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">★{stat.averageRating}</span>
                        <badge_1.Badge variant={stat.averageRating >= 4 ? "default" : "secondary"}>
                          {stat.averageRating >= 4 ? "優秀" : "要改善"}
                        </badge_1.Badge>
                      </div>
                    </div>))}
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </tabs_1.TabsContent>

          {/* ブックマーク */}
          <tabs_1.TabsContent value="bookmarks" className="space-y-6">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.Bookmark className="w-5 h-5 text-blue-500"/>
                  ブックマークした問題
                </card_1.CardTitle>
                <card_1.CardDescription>
                  重要な問題や復習したい問題をブックマークして管理
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bookmarkedSessions.length === 0 ? (<div className="text-center py-8 text-muted-foreground">
                      <lucide_react_1.Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-300"/>
                      <p>ブックマークした問題がありません</p>
                      <p className="text-sm mt-1">
                        練習中に重要な問題をブックマークしてみましょう
                      </p>
                    </div>) : (bookmarkedSessions.map((session) => (<div key={session.id} className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors" onClick={() => handleReviewProblem(session)}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">
                              {session.japaneseSentence}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              前回の回答: {session.userTranslation}
                            </div>
                            <div className="text-sm text-green-700 mb-2">
                              <strong>模範解答:</strong>{" "}
                              {session.correctTranslation}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                {getDifficultyName(session.difficultyLevel)}
                              </span>
                              <span>
                                {new Date(session.createdAt).toLocaleDateString("ja-JP")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: session.rating }).map((_, i) => (<lucide_react_1.Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400"/>))}
                              {Array.from({ length: 5 - session.rating }).map((_, i) => (<lucide_react_1.Star key={i} className="w-3 h-3 text-gray-300"/>))}
                            </div>
                            <lucide_react_1.ArrowRight className="w-4 h-4 text-blue-600"/>
                          </div>
                        </div>
                      </div>)))}
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </tabs_1.TabsContent>

          {/* 振り返り機能 */}
          <tabs_1.TabsContent value="review" className="space-y-6">
            {/* 繰り返し練習 */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.RefreshCw className="w-5 h-5 text-blue-500"/>
                  繰り返し練習
                </card_1.CardTitle>
                <card_1.CardDescription>
                  過去1週間に解いた問題をランダムに練習できます。復習に最適です。
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-center space-y-4">
                  {recentSessions.length === 0 ? (<div className="py-8 text-gray-500">
                      <lucide_react_1.RefreshCw className="w-12 h-12 mx-auto mb-3 text-gray-300"/>
                      <p className="text-sm">直近1週間の練習履歴がありません</p>
                      <p className="text-sm mt-1">
                        練習を開始して履歴を蓄積しましょう
                      </p>
                    </div>) : (<div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        過去1週間で {recentSessions.length} 問の履歴があります
                      </div>
                      {subscription?.subscriptionType === "premium" ? (<button_1.Button onClick={() => handleRepeatPractice()} className="w-full" size="lg">
                          <lucide_react_1.RefreshCw className="w-4 h-4 mr-2"/>
                          繰り返し練習を開始
                        </button_1.Button>) : (<div className="space-y-3">
                          <button_1.Button className="w-full" size="lg" disabled>
                            <lucide_react_1.RefreshCw className="w-4 h-4 mr-2"/>
                            繰り返し練習を開始
                          </button_1.Button>
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800 mb-2">
                              <strong>
                                この機能はプレミアムプラン限定です。
                              </strong>
                            </p>
                            <p className="text-sm text-yellow-700">
                              繰り返すだけで、フレーズが定着し、確実に話せる英語が増えていきます。
                            </p>
                          </div>
                        </div>)}
                    </div>)}
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* 要復習リスト */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.RotateCcw className="w-5 h-5 text-red-500"/>
                  要復習リスト（★2以下）
                </card_1.CardTitle>
                <card_1.CardDescription>
                  評価が低い問題を復習しましょう。クリックして再挑戦できます。
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {reviewSessions.map((session) => (<div key={session.id} className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors" onClick={() => handleReviewProblem(session)}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {session.japaneseSentence}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {getDifficultyName(session.difficultyLevel)}
                          </div>
                        </div>
                        <div className="text-blue-600">
                          <lucide_react_1.ArrowRight className="w-4 h-4"/>
                        </div>
                      </div>
                    </div>))}
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* 再挑戦リスト */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.TrendingUp className="w-5 h-5 text-orange-500"/>
                  再挑戦リスト（★3）
                </card_1.CardTitle>
                <card_1.CardDescription>
                  もう一度チャレンジしてスコアアップを目指しましょう。クリックして再挑戦できます。
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {rechallengeList.map((session) => (<div key={session.id} className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors" onClick={() => handleReviewProblem(session)}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {session.japaneseSentence}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {getDifficultyName(session.difficultyLevel)}
                          </div>
                        </div>
                        <div className="text-blue-600">
                          <lucide_react_1.ArrowRight className="w-4 h-4"/>
                        </div>
                      </div>
                    </div>))}
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </tabs_1.TabsContent>

          {/* シミュレーション作成 */}
          <tabs_1.TabsContent value="scenarios" className="space-y-6">
            {!canAccessPremiumFeatures ? (<card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="flex items-center gap-2">
                    <lucide_react_1.Plus className="w-5 h-5"/>
                    シミュレーション作成
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-center py-12">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 mb-2">
                        <strong>この機能はプレミアムプラン限定です。</strong>
                      </p>
                      <p className="text-sm text-yellow-700">
                        リアルなビジネスシーンを想定したシミュレーション練習を体験したい方は、プレミアムプランをご検討ください。
                      </p>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>) : (<>
                {/* 新しいシナリオ作成 */}
                <card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle className="flex items-center gap-2">
                      <lucide_react_1.Plus className="w-5 h-5"/>
                      新しいシミュレーション作成
                    </card_1.CardTitle>
                    <card_1.CardDescription>
                      自分だけのオリジナル英語練習シーンを作成
                    </card_1.CardDescription>
                  </card_1.CardHeader>
                  <card_1.CardContent className="space-y-4">
                    <div>
                      <label_1.Label htmlFor="title">シミュレーションタイトル</label_1.Label>
                      <input_1.Input id="title" placeholder="例：上司に英語で報告する場面" value={newScenario.title} onChange={(e) => setNewScenario({
                ...newScenario,
                title: e.target.value,
            })}/>
                    </div>
                    <div>
                      <label_1.Label htmlFor="description">詳細説明</label_1.Label>
                      <textarea_1.Textarea id="description" placeholder="例：プロジェクトの進捗を上司に英語で報告する際に使える表現を練習します。報告内容には成果、課題、今後の予定を含めてください。" value={newScenario.description} onChange={(e) => setNewScenario({
                ...newScenario,
                description: e.target.value,
            })} rows={4}/>
                    </div>
                    <button_1.Button onClick={handleCreateScenario} disabled={createScenarioMutation.isPending ||
                !newScenario.title ||
                !newScenario.description}>
                      シミュレーションを作成
                    </button_1.Button>
                  </card_1.CardContent>
                </card_1.Card>

                {/* 作成済みシナリオ一覧 */}
                <card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle>作成済みシミュレーション</card_1.CardTitle>
                    <card_1.CardDescription>
                      シナリオを編集するか、「練習開始」で実際にシミュレーション練習ができます
                    </card_1.CardDescription>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    <div className="space-y-4">
                      {customScenarios.map((scenario) => (<div key={scenario.id} className="p-4 border rounded-lg">
                          {editingScenario?.id === scenario.id ? (<div className="space-y-3">
                              <input_1.Input value={editingScenario.title} onChange={(e) => setEditingScenario({
                        ...editingScenario,
                        title: e.target.value,
                    })}/>
                              <textarea_1.Textarea value={editingScenario.description} onChange={(e) => setEditingScenario({
                        ...editingScenario,
                        description: e.target.value,
                    })} rows={3}/>
                              <div className="flex gap-2">
                                <button_1.Button size="sm" onClick={handleUpdateScenario}>
                                  保存
                                </button_1.Button>
                                <button_1.Button size="sm" variant="outline" onClick={() => setEditingScenario(null)}>
                                  キャンセル
                                </button_1.Button>
                              </div>
                            </div>) : (<div>
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h3 className="font-medium">
                                    {scenario.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {scenario.description}
                                  </p>
                                  <div className="text-xs text-muted-foreground mt-2">
                                    作成日:{" "}
                                    {new Date(scenario.createdAt).toLocaleDateString("ja-JP")}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button_1.Button size="sm" variant="default" onClick={() => (window.location.href = `/simulation/${scenario.id}`)}>
                                    練習開始
                                  </button_1.Button>
                                  <button_1.Button size="sm" variant="outline" onClick={() => setEditingScenario(scenario)}>
                                    <lucide_react_1.Edit className="w-4 h-4"/>
                                  </button_1.Button>
                                  <button_1.Button size="sm" variant="outline" onClick={() => handleDeleteScenario(scenario.id)}>
                                    <lucide_react_1.Trash2 className="w-4 h-4"/>
                                  </button_1.Button>
                                </div>
                              </div>
                            </div>)}
                        </div>))}
                    </div>
                  </card_1.CardContent>
                </card_1.Card>
              </>)}
          </tabs_1.TabsContent>

          {/* アカウント情報タブ */}
          <tabs_1.TabsContent value="account" className="space-y-6">
            {/* 現在のプラン情報 */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.Settings className="w-5 h-5 text-blue-500"/>
                  現在のプラン
                </card_1.CardTitle>
                <card_1.CardDescription>
                  ご利用中のサブスクリプションプランの詳細情報
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {subscription?.subscriptionType === "premium" ? (<lucide_react_1.Crown className="w-6 h-6 text-purple-600"/>) : (<lucide_react_1.User className="w-6 h-6 text-blue-600"/>)}
                      <div>
                        <h3 className="font-semibold text-lg">
                          {subscription?.subscriptionStatus === "trialing"
            ? `${subscription?.subscriptionType === "premium" ? "プレミアム" : "スタンダード"}プラン（トライアル中）`
            : subscription?.subscriptionType === "premium"
                ? "プレミアムプラン"
                : "スタンダードプラン"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {subscription?.subscriptionType === "premium" &&
            subscription?.subscriptionStatus === "trialing"
            ? "全機能・無制限アクセス（トライアル中）"
            : subscription?.subscriptionType === "premium"
                ? "全機能・無制限アクセス"
                : subscription?.subscriptionStatus === "trialing"
                    ? "基本機能・50問/日（トライアル中）"
                    : "基本機能・50問/日"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <badge_1.Badge variant={subscription?.subscriptionType === "premium"
            ? "default"
            : "secondary"}>
                        {subscription?.subscriptionType === "premium"
            ? "プレミアム"
            : "スタンダード"}
                      </badge_1.Badge>
                    </div>
                  </div>

                  {/* トライアル情報（該当する場合） */}
                  {subscription?.subscriptionStatus === "trialing" &&
            subscription?.trialStart && (<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <lucide_react_1.Calendar className="w-4 h-4 text-green-600"/>
                          <span className="font-medium text-green-800">
                            無料トライアル中（残り
                            {Math.max(0, 7 -
                Math.floor((Date.now() -
                    new Date(subscription.trialStart).getTime()) /
                    (1000 * 60 * 60 * 24)))}
                            日）
                          </span>
                        </div>
                        <p className="text-sm text-green-700">
                          トライアル期間終了後、自動的に
                          {subscription?.subscriptionType === "premium"
                ? "プレミアムプラン（月額1,300円）"
                : "スタンダードプラン（月額980円）"}
                          に移行されます。
                        </p>
                      </div>)}
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* プラン変更 */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.CreditCard className="w-5 h-5 text-green-500"/>
                  プラン変更
                </card_1.CardTitle>
                <card_1.CardDescription>
                  サブスクリプションプランのアップグレード・ダウングレード
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  {subscription?.subscriptionType === "standard" ? (<div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">
                              プレミアム月額プランにアップグレード
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              無制限問題、カスタムシナリオ、詳細分析機能（日割り計算でアップグレード）
                            </p>
                          </div>
                          <button_1.Button className="bg-purple-600 hover:bg-purple-700" onClick={() => handleUpgradeSubscription("monthly")} disabled={upgradeSubscriptionMutation.isPending}>
                            <lucide_react_1.Crown className="w-4 h-4 mr-2"/>
                            {upgradeSubscriptionMutation.isPending
                ? "処理中..."
                : "月額にアップグレード"}
                          </button_1.Button>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">
                              プレミアム年間プランにアップグレード
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              2ヶ月分お得、無制限問題、カスタムシナリオ（日割り計算でアップグレード）
                            </p>
                          </div>
                          <button_1.Button className="bg-purple-600 hover:bg-purple-700" onClick={() => handleUpgradeSubscription("yearly")} disabled={upgradeSubscriptionMutation.isPending}>
                            <lucide_react_1.Crown className="w-4 h-4 mr-2"/>
                            {upgradeSubscriptionMutation.isPending
                ? "処理中..."
                : "年間にアップグレード"}
                          </button_1.Button>
                        </div>
                      </div>
                    </div>) : (<div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            スタンダードプランにダウングレード
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            基本機能のみ利用（次回請求時から適用）
                          </p>
                        </div>
                        <button_1.Button variant="outline" onClick={() => createCustomerPortalMutation.mutate()} disabled={createCustomerPortalMutation.isPending}>
                          {createCustomerPortalMutation.isPending
                ? "処理中..."
                : "ダウングレード"}
                        </button_1.Button>
                      </div>
                    </div>)}

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">年会費プランに変更</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          月額プランより2ヶ月分お得
                        </p>
                      </div>
                      <button_1.Button variant="outline" onClick={() => createCustomerPortalMutation.mutate()} disabled={createCustomerPortalMutation.isPending}>
                        {createCustomerPortalMutation.isPending
            ? "処理中..."
            : "年会費に変更"}
                      </button_1.Button>
                    </div>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* プラン比較表 */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.TrendingUp className="w-5 h-5 text-purple-500"/>
                  プラン比較
                </card_1.CardTitle>
                <card_1.CardDescription>
                  スタンダードプランとプレミアムプランの機能比較
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">
                          機能
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-900">
                          スタンダードプラン
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-900">
                          プレミアムプラン
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 font-medium">
                          月額料金
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center font-medium">
                          980円
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center font-medium">
                          1,300円
                        </td>
                      </tr>
                      <tr className="bg-gray-50/50">
                        <td className="border border-gray-200 px-4 py-3 font-medium">
                          年会費 (2ヶ月分お得)
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center font-medium">
                          9,800円
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center font-medium">
                          13,000円
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 font-medium">
                          基本練習機能
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center text-green-600">
                          ✓
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center text-green-600">
                          ✓
                        </td>
                      </tr>
                      <tr className="bg-gray-50/50">
                        <td className="border border-gray-200 px-4 py-3 font-medium">
                          1日の練習問題上限
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          50問
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          100問
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 font-medium">
                          繰り返し練習
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center text-red-500">
                          ✗
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center text-green-600">
                          ✓
                        </td>
                      </tr>
                      <tr className="bg-gray-50/50">
                        <td className="border border-gray-200 px-4 py-3 font-medium">
                          シミュレーション練習
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center text-red-500">
                          ✗
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center text-green-600">
                          ✓
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 font-medium">
                          進捗レポート
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center text-green-600">
                          ✓
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center text-green-600">
                          ✓
                        </td>
                      </tr>
                      <tr className="bg-gray-50/50">
                        <td className="border border-gray-200 px-4 py-3 font-medium">
                          ブックマーク機能
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center text-green-600">
                          ✓
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center text-green-600">
                          ✓
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 font-medium">
                          音声読み上げ
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center text-green-600">
                          ✓
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center text-green-600">
                          ✓
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* 支払い管理 */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.CreditCard className="w-5 h-5 text-orange-500"/>
                  支払い管理
                </card_1.CardTitle>
                <card_1.CardDescription>
                  請求情報の確認とサブスクリプションの管理
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">次回請求日</h4>
                      <span className="text-sm text-gray-600">
                        {(() => {
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 7); // 7日間のトライアル
            return trialEndDate.toLocaleDateString("ja-JP");
        })()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">請求金額</h4>
                      <span className="text-lg font-bold">月額1,300円</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button_1.Button variant="outline" className="flex-1" onClick={() => createCustomerPortalMutation.mutate()} disabled={createCustomerPortalMutation.isPending}>
                      <lucide_react_1.ExternalLink className="w-4 h-4 mr-2"/>
                      {createCustomerPortalMutation.isPending
            ? "処理中..."
            : "請求履歴を確認"}
                    </button_1.Button>
                    <button_1.Button variant="outline" className="flex-1" onClick={() => createCustomerPortalMutation.mutate()} disabled={createCustomerPortalMutation.isPending}>
                      <lucide_react_1.CreditCard className="w-4 h-4 mr-2"/>
                      {createCustomerPortalMutation.isPending
            ? "処理中..."
            : "支払い方法を変更"}
                    </button_1.Button>
                  </div>

                  <div className="pt-4 border-t">
                    <button_1.Button variant="destructive" className="w-full" onClick={() => createCustomerPortalMutation.mutate()} disabled={createCustomerPortalMutation.isPending}>
                      {createCustomerPortalMutation.isPending
            ? "処理中..."
            : "サブスクリプションを解約"}
                    </button_1.Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      解約後も現在の請求期間終了まではご利用いただけます
                    </p>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* ユーザープロファイル */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.User className="w-5 h-5 text-green-500"/>
                  アカウント情報
                </card_1.CardTitle>
                <card_1.CardDescription>ログイン情報とアカウント管理</card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <lucide_react_1.User className="w-6 h-6 text-white"/>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{user?.email}</h3>
                          {isAdmin && (<lucide_react_1.Shield className="w-4 h-4 text-orange-500"/>)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {isAdmin ? "管理者アカウント" : "ユーザーアカウント"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p>登録日</p>
                      <p>
                        {user?.created_at
            ? new Date(user.created_at).toLocaleDateString("ja-JP")
            : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <button_1.Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50" onClick={handleLogout} disabled={isLoggingOut}>
                      <lucide_react_1.LogOut className="w-4 h-4 mr-2"/>
                      {isLoggingOut ? "ログアウト中..." : "ログアウト"}
                    </button_1.Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      セッションを終了してトップページに戻ります
                    </p>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </tabs_1.TabsContent>
        </tabs_1.Tabs>
      </div>
    </div>);
}
