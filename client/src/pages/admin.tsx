import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Users, 
  MessageSquare, 
  CreditCard, 
  BarChart3, 
  Download,
  Lock,
  Home,
  Edit
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalRevenue: number;
  activeSubscriptions: number;
  monthlyActiveUsers: number;
  weeklyActiveUsers: number;
  standardSubscriptions: number;
  premiumSubscriptions: number;
  averageSessionsPerUser: number;
}

interface UserSubscription {
  id: number;
  userId: string;
  subscriptionType: "standard" | "premium";
  subscriptionStatus: string;
  planName?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  validUntil?: Date;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserData {
  id: string;
  email: string;
  subscriptionType: string;
  isAdmin: boolean;
  createdAt: string;
  lastActive: string;
}

interface LearningAnalytics {
  totalLearningTime: number;
  totalLearningCount: number;
  categoryStats: Array<{
    category: string;
    correctRate: number;
    totalAttempts: number;
  }>;
  monthlyStats: Array<{
    month: string;
    sessions: number;
    averageRating: number;
  }>;
}

interface PaymentData {
  stripeConnected: boolean;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  totalTransactions: number;
  activeSubscriptions?: number;
  recentPayments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created: string;
    description: string;
    customerEmail: string;
  }>;
  error?: string;
}

export default function Admin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Check admin access
  const { data: userSubscription, isLoading: isLoadingAuth } = useQuery<UserSubscription>({
    queryKey: ["/api/user-subscription"],
  });

  const { data: adminStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: userSubscription?.isAdmin === true,
  });

  const { data: users } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
    enabled: userSubscription?.isAdmin === true && activeTab === "users",
  });

  const { data: analytics } = useQuery<LearningAnalytics>({
    queryKey: ["/api/admin/analytics"],
    enabled: userSubscription?.isAdmin === true && (activeTab === "analytics" || activeTab === "content"),
  });

  const { data: paymentData } = useQuery<PaymentData>({
    queryKey: ["/api/admin/payments"],
    enabled: userSubscription?.isAdmin === true && activeTab === "payments",
  });

  const exportDataMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await apiRequest(`/api/admin/export/${type}`, { method: "GET" });
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
    mutationFn: async ({ userId, subscriptionType }: { userId: string; subscriptionType: string }) => {
      return await apiRequest(`/api/admin/users/${userId}/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionType }),
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!userSubscription?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-800">アクセス制限</CardTitle>
            <CardDescription className="text-base">
              このページは管理者のみがアクセスできます
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              ホームに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              ホームに戻る
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
          {[
            { id: "overview", label: "概要", icon: BarChart3 },
            { id: "users", label: "ユーザー管理", icon: Users },
            { id: "content", label: "コンテンツ管理", icon: MessageSquare },
            { id: "payments", label: "決済状況", icon: CreditCard },
            { id: "analytics", label: "学習分析", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Main Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    平均セッション: {adminStats?.averageSessionsPerUser || 0}回/ユーザー
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">総学習セッション</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats?.totalSessions || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    全ユーザーの学習記録
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">月間売上</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">¥{adminStats?.totalRevenue?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    アクティブサブスクリプション収益
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">月間アクティブユーザー</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats?.monthlyActiveUsers || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    過去30日間の学習者
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">サブスクリプション詳細</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">スタンダード</span>
                      <span className="font-bold">{adminStats?.standardSubscriptions || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">プレミアム</span>
                      <span className="font-bold">{adminStats?.premiumSubscriptions || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-sm font-medium">合計アクティブ</span>
                      <span className="font-bold">{adminStats?.activeSubscriptions || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ユーザーアクティビティ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">週間アクティブ</span>
                      <span className="font-bold">{adminStats?.weeklyActiveUsers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">月間アクティブ</span>
                      <span className="font-bold">{adminStats?.monthlyActiveUsers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-sm font-medium">登録ユーザー</span>
                      <span className="font-bold">{adminStats?.totalUsers || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">学習統計</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">総セッション数</span>
                      <span className="font-bold">{adminStats?.totalSessions || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">平均セッション/ユーザー</span>
                      <span className="font-bold">{adminStats?.averageSessionsPerUser || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle>ユーザー管理</CardTitle>
              <CardDescription>登録ユーザーの一覧と管理</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users?.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{user.email}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Label htmlFor={`subscription-${user.id}`} className="text-sm">
                        Standard
                      </Label>
                      <Switch
                        id={`subscription-${user.id}`}
                        checked={user.subscriptionType === "premium"}
                        onCheckedChange={(checked) => {
                          const newSubscriptionType = checked ? "premium" : "standard";
                          updateSubscriptionMutation.mutate({ 
                            userId: user.id, 
                            subscriptionType: newSubscriptionType 
                          });
                        }}
                        disabled={updateSubscriptionMutation.isPending}
                      />
                      <Label htmlFor={`subscription-${user.id}`} className="text-sm">
                        Premium
                      </Label>
                    </div>
                  </div>
                )) || <div className="text-center py-8 text-gray-500">ユーザーデータを読み込み中...</div>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Management Tab */}
        {activeTab === "content" && (
          <div className="space-y-6">
            {/* Content Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">総問題数</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalLearningCount || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    全カテゴリの学習問題
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">カテゴリ数</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.categoryStats?.length || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    アクティブなカテゴリ
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">平均正答率</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.categoryStats ? 
                      Math.round(analytics.categoryStats.reduce((sum, cat) => sum + cat.correctRate, 0) / analytics.categoryStats.length) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    全カテゴリ平均
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">総学習時間</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.totalLearningTime ? Math.round(analytics.totalLearningTime / 60) : 0}h
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    累計学習時間
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Category Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="w-5 h-5 mr-2" />
                  カテゴリ別コンテンツ管理
                </CardTitle>
                <CardDescription>各カテゴリの学習データと統計情報</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.categoryStats?.map((category, index) => (
                    <div key={`${category.category}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{category.category}</h3>
                        <p className="text-sm text-muted-foreground">
                          問題数: {category.totalAttempts}回 | 正答率: {category.correctRate}%
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={category.correctRate >= 70 ? "default" : category.correctRate >= 50 ? "secondary" : "destructive"}
                        >
                          {category.correctRate >= 70 ? "良好" : category.correctRate >= 50 ? "普通" : "要改善"}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => exportDataMutation.mutate('sessions')}
                          disabled={exportDataMutation.isPending}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          データ出力
                        </Button>
                      </div>
                    </div>
                  )) || <div className="text-center py-8 text-gray-500">カテゴリデータを読み込み中...</div>}
                </div>
              </CardContent>
            </Card>

            {/* Content Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>データエクスポート</CardTitle>
                  <CardDescription>学習データの一括取得</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => exportDataMutation.mutate('users')}
                    disabled={exportDataMutation.isPending}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    ユーザーデータをエクスポート
                  </Button>
                  <Button 
                    onClick={() => exportDataMutation.mutate('sessions')}
                    disabled={exportDataMutation.isPending}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    学習セッションデータをエクスポート
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>システム統計</CardTitle>
                  <CardDescription>コンテンツの利用状況</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">最も人気のカテゴリ</span>
                      <span className="font-bold">
                        {analytics?.categoryStats?.reduce((prev, current) => 
                          prev.totalAttempts > current.totalAttempts ? prev : current
                        )?.category || "データなし"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">最高正答率カテゴリ</span>
                      <span className="font-bold">
                        {analytics?.categoryStats?.reduce((prev, current) => 
                          prev.correctRate > current.correctRate ? prev : current
                        )?.category || "データなし"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-sm font-medium">アクティブ月</span>
                      <span className="font-bold">{analytics?.monthlyStats?.length || 0}ヶ月</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            {paymentData ? (
              <>
                {/* Payment Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">現金回収済み</CardTitle>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">¥{paymentData.totalRevenue?.toLocaleString() || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        実際に回収済みの売上
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">月間継続売上</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">¥{paymentData.monthlyRecurringRevenue?.toLocaleString() || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        アクティブサブスクリプションMRR
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">売掛金 (予定収益)</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ¥{((paymentData.monthlyRecurringRevenue || 0) * 3).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        今後3ヶ月の予定売上
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">アクティブ顧客</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{paymentData.activeSubscriptions || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        継続課金中の顧客数
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>財務サマリー</CardTitle>
                      <CardDescription>売上・回収状況の詳細</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">現金回収済み</span>
                          <span className="font-bold text-green-600">¥{(paymentData.totalRevenue || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">月間継続売上 (MRR)</span>
                          <span className="font-bold text-blue-600">¥{(paymentData.monthlyRecurringRevenue || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">3ヶ月予定売掛金</span>
                          <span className="font-bold text-orange-600">¥{((paymentData.monthlyRecurringRevenue || 0) * 3).toLocaleString()}</span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">年間予想売上</span>
                            <span className="font-bold text-purple-600">¥{((paymentData.monthlyRecurringRevenue || 0) * 12).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Stripe接続状況</CardTitle>
                      <CardDescription>決済システム連携情報</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">接続状況</span>
                          <Badge variant={paymentData.stripeConnected ? "default" : "destructive"}>
                            {paymentData.stripeConnected ? "正常接続中" : "未接続"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">総取引数</span>
                          <span className="font-bold">{paymentData.totalTransactions || 0}件</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">アクティブ顧客</span>
                          <span className="font-bold">{paymentData.activeSubscriptions || 0}名</span>
                        </div>
                        {!paymentData.stripeConnected && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {paymentData.error || "STRIPE_SECRET_KEY環境変数が必要です"}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Payments */}
                {paymentData.stripeConnected && paymentData.recentPayments && paymentData.recentPayments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>最近の決済履歴</CardTitle>
                      <CardDescription>直近10件の取引詳細</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {paymentData.recentPayments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex-1">
                              <div className="font-medium">{payment.description}</div>
                              <div className="text-sm text-muted-foreground">
                                顧客: {payment.customerEmail} ・ 日時: {new Date(payment.created).toLocaleDateString('ja-JP')}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">¥{payment.amount.toLocaleString()}</div>
                              <Badge variant={payment.status === 'succeeded' ? 'default' : 'destructive'}>
                                {payment.status === 'succeeded' ? '決済成功' : payment.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!paymentData.stripeConnected && (
                  <Card>
                    <CardHeader>
                      <CardTitle>決済設定が必要</CardTitle>
                      <CardDescription>Stripeとの連携が必要です</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <div className="text-muted-foreground mb-4">
                          決済データを表示するにはSTRIPE_SECRET_KEY環境変数の設定が必要です。
                        </div>
                        <div className="text-sm text-muted-foreground">
                          エラー: {paymentData.error}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>決済状況確認</CardTitle>
                  <CardDescription>Stripe連携による決済情報</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    決済データを読み込み中...
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>学習分析</CardTitle>
                  <CardDescription>ユーザーの学習データと統計</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportDataMutation.mutate("users")}
                    disabled={exportDataMutation.isPending}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    ユーザーCSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportDataMutation.mutate("sessions")}
                    disabled={exportDataMutation.isPending}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    セッションCSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">学習統計</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>総学習時間</span>
                          <span className="font-medium">{analytics.totalLearningTime}分</span>
                        </div>
                        <div className="flex justify-between">
                          <span>総学習回数</span>
                          <span className="font-medium">{analytics.totalLearningCount}回</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">カテゴリ別正答率</h3>
                      <div className="space-y-2">
                        {analytics.categoryStats?.map((stat) => (
                          <div key={stat.category} className="flex justify-between">
                            <span>{stat.category}</span>
                            <span className="font-medium">{stat.correctRate}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    分析データを読み込み中...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}