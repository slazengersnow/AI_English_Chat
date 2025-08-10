import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
// import { apiRequest } from '@/lib/queryClient';

interface UsageStats {
  todayUsers: number;
  todayProblems: number;
  categoryStats: Record<string, number>;
  realtimeConnections?: number;
}

interface SubscriptionInfo {
  activeSubscribers: number;
  trialUsers: number;
  monthlyRevenue: number;
}

interface User {
  id: string;
  email: string;
  createdAt: string;
  subscriptionStatus: 'active' | 'trial' | 'inactive';
  lastActive?: string;
}

interface SystemStatus {
  claudeApi: 'healthy' | 'degraded' | 'down';
  stripeApi: 'healthy' | 'degraded' | 'down';
  database: 'healthy' | 'degraded' | 'down';
  lastUpdated: string;
}

export default function AdminDashboard({ onBackToMenu }: { onBackToMenu: () => void }) {
  // Record current page as admin dashboard for refresh persistence
  useEffect(() => {
    localStorage.setItem('englishTrainingCurrentPage', 'admin');
  }, []);

  const [usageStats, setUsageStats] = useState<UsageStats>({
    todayUsers: 0,
    todayProblems: 0,
    categoryStats: {}
  });
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    activeSubscribers: 0,
    trialUsers: 0,
    monthlyRevenue: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    claudeApi: 'healthy',
    stripeApi: 'healthy',
    database: 'healthy',
    lastUpdated: new Date().toLocaleString()
  });
  const [notification, setNotification] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for testing
      setUsageStats({
        todayUsers: 156,
        todayProblems: 1240,
        categoryStats: {
          'TOEIC': 345,
          '中学英語': 298,
          '高校英語': 267,
          '基本動詞': 198,
          'ビジネスメール': 132
        },
        realtimeConnections: 23
      });

      setSubscriptionInfo({
        activeSubscribers: 89,
        trialUsers: 34,
        monthlyRevenue: 45600
      });

      // Mock users data
      setUsers([
        { id: '1', email: 'user1@example.com', createdAt: '2025-08-01', subscriptionStatus: 'active', lastActive: '2025-08-07' },
        { id: '2', email: 'user2@example.com', createdAt: '2025-07-28', subscriptionStatus: 'trial', lastActive: '2025-08-06' },
        { id: '3', email: 'user3@example.com', createdAt: '2025-07-25', subscriptionStatus: 'inactive', lastActive: '2025-08-05' },
      ]);

      // Mock system status
      setSystemStatus({
        claudeApi: 'healthy',
        stripeApi: 'healthy', 
        database: 'healthy',
        lastUpdated: new Date().toLocaleString()
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendNotification = async () => {
    if (!notification.trim()) return;

    try {
      // Mock notification sending
      console.log('Sending notification:', notification);
      alert('お知らせを送信しました');
      setNotification('');
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('送信エラーが発生しました');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'down': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return '正常';
      case 'degraded': return '軽微な問題';
      case 'down': return '停止中';
      default: return '不明';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost"
            onClick={onBackToMenu}
            className="text-gray-600 hover:text-gray-800"
          >
            ← メニューに戻る
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">管理者ダッシュボード</h1>
          <div className="text-sm text-gray-500">
            最終更新: {systemStatus.lastUpdated}
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="usage">利用状況</TabsTrigger>
            <TabsTrigger value="problems">問題分析</TabsTrigger>
            <TabsTrigger value="subscription">契約情報</TabsTrigger>
            <TabsTrigger value="users">ユーザー一覧</TabsTrigger>
            <TabsTrigger value="admin">運用設定</TabsTrigger>
          </TabsList>

          {/* 利用状況タブ */}
          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">今日のユーザー数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {usageStats.todayUsers.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">ユニークユーザー</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">今日の出題数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {usageStats.todayProblems.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">全カテゴリ合計</p>
                </CardContent>
              </Card>

              {usageStats.realtimeConnections !== undefined && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">リアルタイム接続数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {usageStats.realtimeConnections}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">現在オンライン</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* カテゴリ別統計 */}
            <Card>
              <CardHeader>
                <CardTitle>カテゴリ別出題数（今日）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(usageStats.categoryStats).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (count / Math.max(...Object.values(usageStats.categoryStats))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 問題分析タブ */}
          <TabsContent value="problems" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>カテゴリ別出題数ランキング（過去7日）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(usageStats.categoryStats)
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, count], index) => (
                    <div key={category} className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{category}</div>
                        <div className="text-sm text-gray-500">{count} 問出題</div>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 契約情報タブ */}
          <TabsContent value="subscription" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">アクティブ契約者</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {subscriptionInfo.activeSubscribers.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">有料会員</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">無料トライアル</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {subscriptionInfo.trialUsers.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">トライアル中</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">今月の売上高</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ¥{subscriptionInfo.monthlyRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Stripe連携</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ユーザー一覧タブ */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ユーザー一覧</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">メール</th>
                        <th className="text-left py-2">登録日</th>
                        <th className="text-left py-2">契約状況</th>
                        <th className="text-left py-2">最終ログイン</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 20).map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="py-2">{user.email}</td>
                          <td className="py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="py-2">
                            <Badge 
                              variant={
                                user.subscriptionStatus === 'active' ? 'default' :
                                user.subscriptionStatus === 'trial' ? 'secondary' : 'outline'
                              }
                            >
                              {user.subscriptionStatus === 'active' ? '有料' :
                               user.subscriptionStatus === 'trial' ? 'トライアル' : '無料'}
                            </Badge>
                          </td>
                          <td className="py-2">
                            {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 運用設定タブ */}
          <TabsContent value="admin" className="space-y-6">
            {/* システム状態 */}
            <Card>
              <CardHeader>
                <CardTitle>システム状態</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Claude API</span>
                    <Badge className={getStatusColor(systemStatus.claudeApi)}>
                      {getStatusText(systemStatus.claudeApi)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Stripe API</span>
                    <Badge className={getStatusColor(systemStatus.stripeApi)}>
                      {getStatusText(systemStatus.stripeApi)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">データベース</span>
                    <Badge className={getStatusColor(systemStatus.database)}>
                      {getStatusText(systemStatus.database)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* お知らせ送信 */}
            <Card>
              <CardHeader>
                <CardTitle>全体通知送信</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={notification}
                  onChange={(e) => setNotification(e.target.value)}
                  placeholder="全ユーザーに送信するお知らせを入力してください..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button 
                  onClick={sendNotification}
                  disabled={!notification.trim()}
                  className="w-full"
                >
                  お知らせを送信
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}