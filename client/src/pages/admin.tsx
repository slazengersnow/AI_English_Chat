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
import { Link } from "wouter";

interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalRevenue: number;
  activeSubscriptions: number;
  monthlyActiveUsers: number;
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

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Check admin access
  const { data: userSubscription, isLoading: isLoadingAuth } = useQuery({
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
    enabled: userSubscription?.isAdmin === true && activeTab === "analytics",
  });

  const exportDataMutation = useMutation({
    mutationFn: async (type: string) => {
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
    mutationFn: async ({ userId, subscriptionType }: { userId: string; subscriptionType: string }) => {
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
      // Invalidate user subscription cache for the top page
      queryClient.invalidateQueries({ queryKey: ["/api/user-subscription"] });
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
            <Link href="/">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                ホームに戻る
              </Button>
            </Link>
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
            <Link href="/">
              <Button variant="outline">
                <Home className="w-4 h-4 mr-2" />
                ホームに戻る
              </Button>
            </Link>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats?.totalUsers || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総学習セッション</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats?.totalSessions || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">アクティブサブスクリプション</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats?.activeSubscriptions || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">月間アクティブユーザー</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats?.monthlyActiveUsers || 0}</div>
              </CardContent>
            </Card>
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
          <Card>
            <CardHeader>
              <CardTitle>コンテンツ管理</CardTitle>
              <CardDescription>投稿・問題・コンテンツの管理</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                コンテンツ管理機能は開発中です
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <Card>
            <CardHeader>
              <CardTitle>決済状況確認</CardTitle>
              <CardDescription>Stripe連携による決済情報</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                決済状況確認機能は開発中です
              </div>
            </CardContent>
          </Card>
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