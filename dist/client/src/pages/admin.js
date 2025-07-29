"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Admin;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const switch_1 = require("@/components/ui/switch");
const label_1 = require("@/components/ui/label");
const lucide_react_1 = require("lucide-react");
const queryClient_1 = require("@/lib/queryClient");
const use_toast_1 = require("@/hooks/use-toast");
const wouter_1 = require("wouter");
function Admin() {
    const { toast } = (0, use_toast_1.useToast)();
    const [activeTab, setActiveTab] = (0, react_1.useState)("overview");
    // Check admin access
    const { data: userSubscription, isLoading: isLoadingAuth } = (0, react_query_1.useQuery)({
        queryKey: ["/api/user-subscription"],
    });
    const { data: adminStats } = (0, react_query_1.useQuery)({
        queryKey: ["/api/admin/stats"],
        enabled: userSubscription?.isAdmin === true,
    });
    const { data: users } = (0, react_query_1.useQuery)({
        queryKey: ["/api/admin/users"],
        enabled: userSubscription?.isAdmin === true && activeTab === "users",
    });
    const { data: analytics } = (0, react_query_1.useQuery)({
        queryKey: ["/api/admin/analytics"],
        enabled: userSubscription?.isAdmin === true && activeTab === "analytics",
    });
    const exportDataMutation = (0, react_query_1.useMutation)({
        mutationFn: async (type) => {
            const response = await (0, queryClient_1.apiRequest)("GET", `/api/admin/export/${type}`);
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
    const updateSubscriptionMutation = (0, react_query_1.useMutation)({
        mutationFn: async ({ userId, subscriptionType }) => {
            return await (0, queryClient_1.apiRequest)("PUT", `/api/admin/users/${userId}/subscription`, {
                subscriptionType,
            });
        },
        onSuccess: () => {
            toast({
                title: "更新完了",
                description: "ユーザーのサブスクリプションタイプを更新しました。",
            });
            // Invalidate admin users data
            queryClient_1.queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            // Force refetch user subscription cache for the top page after a small delay
            setTimeout(() => {
                queryClient_1.queryClient.invalidateQueries({ queryKey: ["/api/user-subscription"] });
                queryClient_1.queryClient.refetchQueries({ queryKey: ["/api/user-subscription"] });
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
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
      </div>);
    }
    if (!userSubscription?.isAdmin) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <card_1.Card className="max-w-md w-full">
          <card_1.CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <lucide_react_1.Lock className="w-8 h-8 text-red-600"/>
            </div>
            <card_1.CardTitle className="text-xl text-red-800">アクセス制限</card_1.CardTitle>
            <card_1.CardDescription className="text-base">
              このページは管理者のみがアクセスできます
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="text-center">
            <wouter_1.Link href="/">
              <button_1.Button variant="outline" className="w-full">
                <lucide_react_1.Home className="w-4 h-4 mr-2"/>
                ホームに戻る
              </button_1.Button>
            </wouter_1.Link>
          </card_1.CardContent>
        </card_1.Card>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <lucide_react_1.Shield className="w-8 h-8 text-blue-600 mr-3"/>
              <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
            </div>
            <wouter_1.Link href="/">
              <button_1.Button variant="outline">
                <lucide_react_1.Home className="w-4 h-4 mr-2"/>
                ホームに戻る
              </button_1.Button>
            </wouter_1.Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
          {[
            { id: "overview", label: "概要", icon: lucide_react_1.BarChart3 },
            { id: "users", label: "ユーザー管理", icon: lucide_react_1.Users },
            { id: "content", label: "コンテンツ管理", icon: lucide_react_1.MessageSquare },
            { id: "payments", label: "決済状況", icon: lucide_react_1.CreditCard },
            { id: "analytics", label: "学習分析", icon: lucide_react_1.BarChart3 },
        ].map((tab) => {
            const Icon = tab.icon;
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"}`}>
                <Icon className="w-4 h-4 mr-2"/>
                {tab.label}
              </button>);
        })}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <card_1.Card>
              <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <card_1.CardTitle className="text-sm font-medium">総ユーザー数</card_1.CardTitle>
                <lucide_react_1.Users className="h-4 w-4 text-muted-foreground"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-2xl font-bold">{adminStats?.totalUsers || 0}</div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <card_1.CardTitle className="text-sm font-medium">総学習セッション</card_1.CardTitle>
                <lucide_react_1.BarChart3 className="h-4 w-4 text-muted-foreground"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-2xl font-bold">{adminStats?.totalSessions || 0}</div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <card_1.CardTitle className="text-sm font-medium">アクティブサブスクリプション</card_1.CardTitle>
                <lucide_react_1.CreditCard className="h-4 w-4 text-muted-foreground"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-2xl font-bold">{adminStats?.activeSubscriptions || 0}</div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <card_1.CardTitle className="text-sm font-medium">月間アクティブユーザー</card_1.CardTitle>
                <lucide_react_1.Users className="h-4 w-4 text-muted-foreground"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-2xl font-bold">{adminStats?.monthlyActiveUsers || 0}</div>
              </card_1.CardContent>
            </card_1.Card>
          </div>)}

        {/* Users Tab */}
        {activeTab === "users" && (<card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>ユーザー管理</card_1.CardTitle>
              <card_1.CardDescription>登録ユーザーの一覧と管理</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                {users?.map((user) => (<div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{user.email}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <label_1.Label htmlFor={`subscription-${user.id}`} className="text-sm">
                        Standard
                      </label_1.Label>
                      <switch_1.Switch id={`subscription-${user.id}`} checked={user.subscriptionType === "premium"} onCheckedChange={(checked) => {
                    const newSubscriptionType = checked ? "premium" : "standard";
                    updateSubscriptionMutation.mutate({
                        userId: user.id,
                        subscriptionType: newSubscriptionType
                    });
                }} disabled={updateSubscriptionMutation.isPending}/>
                      <label_1.Label htmlFor={`subscription-${user.id}`} className="text-sm">
                        Premium
                      </label_1.Label>
                    </div>
                  </div>)) || <div className="text-center py-8 text-gray-500">ユーザーデータを読み込み中...</div>}
              </div>
            </card_1.CardContent>
          </card_1.Card>)}

        {/* Content Management Tab */}
        {activeTab === "content" && (<card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>コンテンツ管理</card_1.CardTitle>
              <card_1.CardDescription>投稿・問題・コンテンツの管理</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-center py-8 text-gray-500">
                コンテンツ管理機能は開発中です
              </div>
            </card_1.CardContent>
          </card_1.Card>)}

        {/* Payments Tab */}
        {activeTab === "payments" && (<card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>決済状況確認</card_1.CardTitle>
              <card_1.CardDescription>Stripe連携による決済情報</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-center py-8 text-gray-500">
                決済状況確認機能は開発中です
              </div>
            </card_1.CardContent>
          </card_1.Card>)}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (<div className="space-y-6">
            <card_1.Card>
              <card_1.CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <card_1.CardTitle>学習分析</card_1.CardTitle>
                  <card_1.CardDescription>ユーザーの学習データと統計</card_1.CardDescription>
                </div>
                <div className="flex space-x-2">
                  <button_1.Button variant="outline" size="sm" onClick={() => exportDataMutation.mutate("users")} disabled={exportDataMutation.isPending}>
                    <lucide_react_1.Download className="w-4 h-4 mr-2"/>
                    ユーザーCSV
                  </button_1.Button>
                  <button_1.Button variant="outline" size="sm" onClick={() => exportDataMutation.mutate("sessions")} disabled={exportDataMutation.isPending}>
                    <lucide_react_1.Download className="w-4 h-4 mr-2"/>
                    セッションCSV
                  </button_1.Button>
                </div>
              </card_1.CardHeader>
              <card_1.CardContent>
                {analytics ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        {analytics.categoryStats?.map((stat) => (<div key={stat.category} className="flex justify-between">
                            <span>{stat.category}</span>
                            <span className="font-medium">{stat.correctRate}%</span>
                          </div>))}
                      </div>
                    </div>
                  </div>) : (<div className="text-center py-8 text-gray-500">
                    分析データを読み込み中...
                  </div>)}
              </card_1.CardContent>
            </card_1.Card>
          </div>)}
      </div>
    </div>);
}
