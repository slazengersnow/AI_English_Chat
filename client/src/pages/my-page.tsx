import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/providers/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  User,
  TrendingUp,
  Calendar,
  Star,
  Bookmark,
  RotateCcw,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Home,
  RefreshCw,
  Settings,
  Crown,
  CreditCard,
  ExternalLink,
  LogOut,
  Shield,
  Mail,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";

interface ProgressData {
  date: string;
  problemsCompleted: number;
  averageRating: number;
}

interface DifficultyStats {
  difficulty: string;
  count: number;
  averageRating: number;
}

interface TrainingSession {
  id: number;
  difficultyLevel: string;
  japaneseSentence: string;
  userTranslation: string;
  correctTranslation: string;
  rating: number;
  isBookmarked?: boolean;
  createdAt: string;
}

interface CustomScenario {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

interface UserSubscription {
  id: number;
  userId: string;
  subscriptionType: "standard" | "premium" | "trialing";
  subscriptionStatus: string;
  trialStart?: string;
}

export default function MyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Cleanup queries on component unmount
  useEffect(() => {
    return () => {
      // Cancel all queries when component unmounts
      if (isLoggingOut) {
        queryClient.cancelQueries();
      }
    };
  }, [isLoggingOut]);

  // Check URL for tab parameter
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get("tab");

  const [activeTab, setActiveTab] = useState(tabFromUrl || "progress");
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  const [newScenario, setNewScenario] = useState({
    title: "",
    description: "",
  });
  const [editingScenario, setEditingScenario] = useState<CustomScenario | null>(
    null,
  );
  const { subscription, canAccessPremiumFeatures } = useSubscription();

  // API queries

  const { data: progressData = [] } = useQuery<ProgressData[]>({
    queryKey: ["/api/progress", selectedPeriod],
  });

  const { data: streakData } = useQuery({
    queryKey: ["/api/streak"],
  });

  const { data: difficultyStats = [] } = useQuery<DifficultyStats[]>({
    queryKey: ["/api/difficulty-stats"],
  });

  const { data: monthlyStats } = useQuery({
    queryKey: ["/api/monthly-stats"],
  });

  const { data: reviewSessions = [] } = useQuery<TrainingSession[]>({
    queryKey: ["/api/review-sessions"],
  });

  // Recent sessions (past week)
  const { data: recentSessions = [] } = useQuery<TrainingSession[]>({
    queryKey: ["/api/recent-sessions"],
  });

  // Subscription details for account tab
  const { data: subscriptionDetails } = useQuery({
    queryKey: ["/api/subscription-details"],
    enabled: activeTab === "account",
  });

  const { data: rechallengeList = [] } = useQuery<TrainingSession[]>({
    queryKey: ["/api/review-sessions", { threshold: 3 }],
    queryFn: () =>
      fetch("/api/review-sessions?threshold=3").then((res) => {
        if (!res.ok) return [];
        return res.json();
      }),
  });

  const { data: bookmarkedSessions = [] } = useQuery<TrainingSession[]>({
    queryKey: ["/api/bookmarked-sessions"],
  });

  const { data: customScenarios = [] } = useQuery<CustomScenario[]>({
    queryKey: ["/api/custom-scenarios"],
  });

  const { data: dailyCount } = useQuery({
    queryKey: ["/api/daily-count"],
  });

  // Mutations

  const createScenarioMutation = useMutation({
    mutationFn: async (scenario: { title: string; description: string }) => {
      const response = await fetch("/api/custom-scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario),
      });
      if (!response.ok) throw new Error("Failed to create scenario");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "シナリオを作成しました" });
      setNewScenario({ title: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-scenarios"] });
    },
  });

  const updateScenarioMutation = useMutation({
    mutationFn: async ({
      id,
      ...scenario
    }: {
      id: number;
      title: string;
      description: string;
    }) => {
      const response = await fetch(`/api/custom-scenarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario),
      });
      if (!response.ok) throw new Error("Failed to update scenario");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "シナリオを更新しました" });
      setEditingScenario(null);
      queryClient.invalidateQueries({ queryKey: ["/api/custom-scenarios"] });
    },
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/custom-scenarios/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete scenario");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "シナリオを削除しました" });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-scenarios"] });
    },
  });

  const createCustomerPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        "/api/create-customer-portal",
        {},
      );
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
    mutationFn: (planType: "monthly" | "yearly") =>
      apiRequest("/api/upgrade-subscription", "POST", { planType }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-subscription"] });
      toast({
        title: "アップグレード完了",
        description: (data as any).message,
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

  const handleUpgradeSubscription = (planType: "monthly" | "yearly") => {
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

  const handleDeleteScenario = (id: number) => {
    deleteScenarioMutation.mutate(id);
  };

  const getDifficultyName = (level: string) => {
    const names = {
      toeic: "TOEIC",
      "middle-school": "中学英語",
      "high-school": "高校英語",
      "basic-verbs": "基本動詞",
      "business-email": "ビジネスメール",
    };
    return names[level as keyof typeof names] || level;
  };

  const handleReviewProblem = (session: TrainingSession) => {
    // Store the problem data in sessionStorage for the practice interface
    sessionStorage.setItem(
      "reviewProblem",
      JSON.stringify({
        japaneseSentence: session.japaneseSentence,
        difficultyLevel: session.difficultyLevel,
        isReview: true,
      }),
    );

    // Navigate to appropriate practice interface
    if (session.difficultyLevel.startsWith("simulation-")) {
      const scenarioId = session.difficultyLevel.replace("simulation-", "");
      navigate(`/simulation-practice?scenario=${scenarioId}`);
    } else {
      // Navigate to home page with difficulty selection
      navigate(`/?difficulty=${session.difficultyLevel}`);
    }
  };

  const handleRepeatPractice = () => {
    if (recentSessions.length === 0) return;

    // Store all recent sessions for repeat practice mode
    sessionStorage.setItem("repeatPracticeMode", "true");
    sessionStorage.setItem(
      "repeatPracticeSessions",
      JSON.stringify(recentSessions),
    );
    sessionStorage.setItem("repeatPracticeIndex", "0");

    // Start with the first session from recent sessions
    const firstSession = recentSessions[0];

    // Navigate to appropriate practice interface
    if (firstSession.difficultyLevel.startsWith("simulation-")) {
      const scenarioId = firstSession.difficultyLevel.replace(
        "simulation-",
        "",
      );
      navigate(`/simulation-practice?scenario=${scenarioId}`);
    } else {
      navigate(`/practice/${firstSession.difficultyLevel}`);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      console.log("🚪 Starting logout process from MyPage");
      
      // Cancel all ongoing queries to prevent AbortError
      queryClient.cancelQueries();
      
      // Sign out from auth provider
      await signOut();
      
      // Clear all cached query data
      queryClient.clear();
      
      // Clear session storage
      sessionStorage.clear();
      
      toast({
        title: "ログアウト完了",
        description: "正常にログアウトしました",
      });
      
      // Navigate immediately to prevent white page flash
      console.log("🏠 Redirecting to home after logout");
      navigate("/", { replace: true });
      
    } catch (error) {
      console.error("❌ Logout error:", error);
      toast({
        title: "ログアウトエラー",
        description: "ログアウト中にエラーが発生しました",
        variant: "destructive",
      });
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold">マイページ</h1>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-white shadow-md">
              <Home className="w-4 h-4 mr-2" />
              トップページ
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="progress">進捗レポート</TabsTrigger>
            <TabsTrigger value="bookmarks">ブックマーク</TabsTrigger>
            <TabsTrigger value="review">振り返り機能</TabsTrigger>
            <TabsTrigger value="scenarios">シミュレーション</TabsTrigger>
            <TabsTrigger value="account">アカウント</TabsTrigger>
          </TabsList>

          {/* 進捗レポート */}
          <TabsContent value="progress" className="space-y-6">
            {/* 統計情報 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    連続学習日数
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {(streakData as any)?.streak || 0}日
                  </div>
                  <p className="text-xs text-muted-foreground">連続達成中！</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    今月の問題数
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {(monthlyStats as any)?.totalProblems || 0}問
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    今月の実績
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    平均★評価
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    ★{(monthlyStats as any)?.averageRating || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">今月の平均</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    今日の問題数
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {(dailyCount as any)?.count || 0}/100
                  </div>
                  <Progress
                    value={(dailyCount as any)?.count || 0}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    残り {(dailyCount as any)?.remaining || 100}問
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 進捗グラフ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  正答率の推移
                </CardTitle>
                <div className="flex gap-2">
                  {["day", "week", "month"].map((period) => (
                    <Button
                      key={period}
                      variant={
                        selectedPeriod === period ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedPeriod(period)}
                    >
                      {period === "day"
                        ? "日"
                        : period === "week"
                          ? "週"
                          : "月"}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatProgressData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Bar
                        yAxisId="left"
                        dataKey="problems"
                        fill="#3b82f6"
                        name="問題数"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="rating"
                        stroke="#f59e0b"
                        name="★評価"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* レベル別進捗 */}
            <Card>
              <CardHeader>
                <CardTitle>レベル別進捗</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {difficultyStats.map((stat) => (
                    <div
                      key={stat.difficulty}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
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
                        <Badge
                          variant={
                            stat.averageRating >= 4 ? "default" : "secondary"
                          }
                        >
                          {stat.averageRating >= 4 ? "優秀" : "要改善"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ブックマーク */}
          <TabsContent value="bookmarks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-blue-500" />
                  ブックマークした問題
                </CardTitle>
                <CardDescription>
                  重要な問題や復習したい問題をブックマークして管理
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bookmarkedSessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>ブックマークした問題がありません</p>
                      <p className="text-sm mt-1">
                        練習中に重要な問題をブックマークしてみましょう
                      </p>
                    </div>
                  ) : (
                    bookmarkedSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors"
                        onClick={() => handleReviewProblem(session)}
                      >
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
                                {new Date(session.createdAt).toLocaleDateString(
                                  "ja-JP",
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: session.rating }).map(
                                (_, i) => (
                                  <Star
                                    key={i}
                                    className="w-3 h-3 fill-yellow-400 text-yellow-400"
                                  />
                                ),
                              )}
                              {Array.from({ length: 5 - session.rating }).map(
                                (_, i) => (
                                  <Star
                                    key={i}
                                    className="w-3 h-3 text-gray-300"
                                  />
                                ),
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 振り返り機能 */}
          <TabsContent value="review" className="space-y-6">
            {/* 繰り返し練習 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                  繰り返し練習
                </CardTitle>
                <CardDescription>
                  過去1週間に解いた問題をランダムに練習できます。復習に最適です。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  {recentSessions.length === 0 ? (
                    <div className="py-8 text-gray-500">
                      <RefreshCw className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">直近1週間の練習履歴がありません</p>
                      <p className="text-sm mt-1">
                        練習を開始して履歴を蓄積しましょう
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        過去1週間で {recentSessions.length} 問の履歴があります
                      </div>
                      {subscription?.subscriptionType === "premium" ? (
                        <Button
                          onClick={() => handleRepeatPractice()}
                          className="w-full"
                          size="lg"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          繰り返し練習を開始
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <Button className="w-full" size="lg" disabled>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            繰り返し練習を開始
                          </Button>
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
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 要復習リスト */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-red-500" />
                  要復習リスト（★2以下）
                </CardTitle>
                <CardDescription>
                  評価が低い問題を復習しましょう。クリックして再挑戦できます。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {reviewSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors"
                      onClick={() => handleReviewProblem(session)}
                    >
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
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 再挑戦リスト */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  再挑戦リスト（★3）
                </CardTitle>
                <CardDescription>
                  もう一度チャレンジしてスコアアップを目指しましょう。クリックして再挑戦できます。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {rechallengeList.map((session) => (
                    <div
                      key={session.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors"
                      onClick={() => handleReviewProblem(session)}
                    >
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
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* シミュレーション作成 */}
          <TabsContent value="scenarios" className="space-y-6">
            {!canAccessPremiumFeatures ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    シミュレーション作成
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            ) : (
              <>
                {/* 新しいシナリオ作成 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      新しいシミュレーション作成
                    </CardTitle>
                    <CardDescription>
                      自分だけのオリジナル英語練習シーンを作成
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">シミュレーションタイトル</Label>
                      <Input
                        id="title"
                        placeholder="例：上司に英語で報告する場面"
                        value={newScenario.title}
                        onChange={(e) =>
                          setNewScenario({
                            ...newScenario,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">詳細説明</Label>
                      <Textarea
                        id="description"
                        placeholder="例：プロジェクトの進捗を上司に英語で報告する際に使える表現を練習します。報告内容には成果、課題、今後の予定を含めてください。"
                        value={newScenario.description}
                        onChange={(e) =>
                          setNewScenario({
                            ...newScenario,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                      />
                    </div>
                    <Button
                      onClick={handleCreateScenario}
                      disabled={
                        createScenarioMutation.isPending ||
                        !newScenario.title ||
                        !newScenario.description
                      }
                    >
                      シミュレーションを作成
                    </Button>
                  </CardContent>
                </Card>

                {/* 作成済みシナリオ一覧 */}
                <Card>
                  <CardHeader>
                    <CardTitle>作成済みシミュレーション</CardTitle>
                    <CardDescription>
                      シナリオを編集するか、「練習開始」で実際にシミュレーション練習ができます
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customScenarios.map((scenario) => (
                        <div
                          key={scenario.id}
                          className="p-4 border rounded-lg"
                        >
                          {editingScenario?.id === scenario.id ? (
                            <div className="space-y-3">
                              <Input
                                value={editingScenario.title}
                                onChange={(e) =>
                                  setEditingScenario({
                                    ...editingScenario,
                                    title: e.target.value,
                                  })
                                }
                              />
                              <Textarea
                                value={editingScenario.description}
                                onChange={(e) =>
                                  setEditingScenario({
                                    ...editingScenario,
                                    description: e.target.value,
                                  })
                                }
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleUpdateScenario}
                                >
                                  保存
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingScenario(null)}
                                >
                                  キャンセル
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
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
                                    {new Date(
                                      scenario.createdAt,
                                    ).toLocaleDateString("ja-JP")}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() =>
                                      navigate(`/simulation/${scenario.id}`)
                                    }
                                  >
                                    練習開始
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingScenario(scenario)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleDeleteScenario(scenario.id)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* アカウント情報タブ */}
          <TabsContent value="account" className="space-y-6">
            {/* 現在のプラン情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  現在のプラン
                </CardTitle>
                <CardDescription>
                  ご利用中のサブスクリプションプランの詳細情報
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {subscription?.subscriptionType === "premium" ? (
                        <Crown className="w-6 h-6 text-purple-600" />
                      ) : (
                        <User className="w-6 h-6 text-blue-600" />
                      )}
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
                      <Badge
                        variant={
                          subscription?.subscriptionType === "premium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {subscription?.subscriptionType === "premium"
                          ? "プレミアム"
                          : "スタンダード"}
                      </Badge>
                    </div>
                  </div>

                  {/* トライアル情報（該当する場合） */}
                  {subscription?.subscriptionStatus === "trialing" &&
                    subscription?.trialStart && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">
                            無料トライアル中（残り
                            {Math.max(
                              0,
                              7 -
                                Math.floor(
                                  (Date.now() -
                                    new Date(
                                      subscription.trialStart,
                                    ).getTime()) /
                                    (1000 * 60 * 60 * 24),
                                ),
                            )}
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
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* プラン変更 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-500" />
                  プラン変更
                </CardTitle>
                <CardDescription>
                  サブスクリプションプランのアップグレード・ダウングレード
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscription?.subscriptionType === "standard" ? (
                    <div className="space-y-4">
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
                          <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleUpgradeSubscription("monthly")}
                            disabled={upgradeSubscriptionMutation.isPending}
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            {upgradeSubscriptionMutation.isPending
                              ? "処理中..."
                              : "月額にアップグレード"}
                          </Button>
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
                          <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleUpgradeSubscription("yearly")}
                            disabled={upgradeSubscriptionMutation.isPending}
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            {upgradeSubscriptionMutation.isPending
                              ? "処理中..."
                              : "年間にアップグレード"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            スタンダードプランにダウングレード
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            基本機能のみ利用（次回請求時から適用）
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => createCustomerPortalMutation.mutate()}
                          disabled={createCustomerPortalMutation.isPending}
                        >
                          {createCustomerPortalMutation.isPending
                            ? "処理中..."
                            : "ダウングレード"}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">年会費プランに変更</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          月額プランより2ヶ月分お得
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => createCustomerPortalMutation.mutate()}
                        disabled={createCustomerPortalMutation.isPending}
                      >
                        {createCustomerPortalMutation.isPending
                          ? "処理中..."
                          : "年会費に変更"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* プラン比較表 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  プラン比較
                </CardTitle>
                <CardDescription>
                  スタンダードプランとプレミアムプランの機能比較
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* 支払い管理 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                  支払い管理
                </CardTitle>
                <CardDescription>
                  請求情報の確認とサブスクリプションの管理
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">次回請求日</h4>
                      <span className="text-sm text-gray-600">
                        {isAdmin ? "なし" : subscriptionDetails?.nextBillingDate || 
                          (() => {
                            const trialEndDate = new Date();
                            trialEndDate.setDate(trialEndDate.getDate() + 7);
                            return trialEndDate.toLocaleDateString("ja-JP");
                          })()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">請求金額</h4>
                      <span className="text-lg font-bold">
                        {isAdmin ? "¥0" : subscriptionDetails?.price || "月額1,300円"}
                      </span>
                    </div>
                  </div>

                  {isAdmin ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">管理者アカウント</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        このアカウントは支払い管理の対象外です。すべての機能を無料でご利用いただけます。
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => createCustomerPortalMutation.mutate()}
                          disabled={createCustomerPortalMutation.isPending}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {createCustomerPortalMutation.isPending
                            ? "処理中..."
                            : "請求履歴を確認"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => createCustomerPortalMutation.mutate()}
                          disabled={createCustomerPortalMutation.isPending}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {createCustomerPortalMutation.isPending
                            ? "処理中..."
                            : "支払い方法を変更"}
                        </Button>
                      </div>

                      <div className="pt-4 border-t">
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => createCustomerPortalMutation.mutate()}
                          disabled={createCustomerPortalMutation.isPending}
                        >
                          {createCustomerPortalMutation.isPending
                            ? "処理中..."
                            : "サブスクリプションを解約"}
                        </Button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          解約後も現在の請求期間終了まではご利用いただけます
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ユーザープロファイル */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-green-500" />
                  アカウント情報
                </CardTitle>
                <CardDescription>ログイン情報とアカウント管理</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{user?.email}</h3>
                          {isAdmin && (
                            <Shield className="w-4 h-4 text-orange-500" />
                          )}
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
                          ? new Date(user.created_at).toLocaleDateString(
                              "ja-JP",
                            )
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {isLoggingOut ? "ログアウト中..." : "ログアウト"}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      セッションを終了してトップページに戻ります
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
