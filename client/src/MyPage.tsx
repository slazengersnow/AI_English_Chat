import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';

interface UserStats {
  totalProblems: number;
  averageRating: number;
  streakDays: number;
  favoriteCategory: string;
  monthlyProgress: number;
  dailyGoal: number;
  weeklyStats: Array<{ day: string; problems: number }>;
}

interface BookmarkedProblem {
  id: string;
  japaneseSentence: string;
  userTranslation: string;
  correctTranslation: string;
  rating: number;
  category: string;
  createdAt: string;
}

export default function MyPage({ onBackToMenu }: { onBackToMenu: () => void }) {
  const [userStats, setUserStats] = useState<UserStats>({
    totalProblems: 0,
    averageRating: 0,
    streakDays: 0,
    favoriteCategory: '',
    monthlyProgress: 0,
    dailyGoal: 30,
    weeklyStats: []
  });
  const [bookmarkedProblems, setBookmarkedProblems] = useState<BookmarkedProblem[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'trial' | 'active' | 'inactive'>('inactive');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Load user statistics
      const statsResponse = await apiRequest('GET', '/api/user/stats');
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setUserStats(stats);
      }

      // Load bookmarked problems
      const bookmarksResponse = await apiRequest('GET', '/api/user/bookmarks');
      if (bookmarksResponse.ok) {
        const bookmarks = await bookmarksResponse.json();
        setBookmarkedProblems(bookmarks);
      }

      // Load subscription status
      const subscriptionResponse = await apiRequest('GET', '/api/user/subscription');
      if (subscriptionResponse.ok) {
        const subscription = await subscriptionResponse.json();
        setSubscriptionStatus(subscription.status);
      }

    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await apiRequest('GET', '/api/user/export-data');
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `english-training-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('データのエクスポートに失敗しました');
    }
  };

  const removeBookmark = async (problemId: string) => {
    try {
      const response = await apiRequest('DELETE', `/api/user/bookmarks/${problemId}`);
      if (response.ok) {
        setBookmarkedProblems(prev => prev.filter(p => p.id !== problemId));
      }
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
    }
  };

  const getSubscriptionBadge = () => {
    switch (subscriptionStatus) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">有料会員</Badge>;
      case 'trial':
        return <Badge className="bg-orange-100 text-orange-800">トライアル中</Badge>;
      default:
        return <Badge variant="outline">無料会員</Badge>;
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
          <h1 className="text-xl font-semibold text-gray-900">マイページ</h1>
          <div className="flex items-center space-x-2">
            {getSubscriptionBadge()}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 学習統計 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">総問題数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {userStats.totalProblems.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">解答済み</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">平均評価</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {userStats.averageRating.toFixed(1)}
              </div>
              <p className="text-xs text-gray-500 mt-1">5点満点</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">連続学習日数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {userStats.streakDays}
              </div>
              <p className="text-xs text-gray-500 mt-1">日間継続</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">得意カテゴリ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-purple-600">
                {userStats.favoriteCategory || 'まだありません'}
              </div>
              <p className="text-xs text-gray-500 mt-1">最高評価</p>
            </CardContent>
          </Card>
        </div>

        {/* 今月の目標進捗 */}
        <Card>
          <CardHeader>
            <CardTitle>今月の学習目標</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">進捗状況</span>
              <span className="text-sm text-gray-600">
                {userStats.monthlyProgress}% ({Math.round(userStats.monthlyProgress * userStats.dailyGoal * 30 / 100)} / {userStats.dailyGoal * 30} 問)
              </span>
            </div>
            <Progress value={userStats.monthlyProgress} className="h-3" />
            <p className="text-xs text-gray-500">
              1日の目標: {userStats.dailyGoal}問
            </p>
          </CardContent>
        </Card>

        {/* 週間統計 */}
        <Card>
          <CardHeader>
            <CardTitle>今週の学習履歴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {userStats.weeklyStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">{stat.day}</div>
                  <div className="h-12 bg-gray-100 rounded flex items-end justify-center">
                    <div 
                      className="bg-blue-500 rounded-b w-full"
                      style={{ 
                        height: `${Math.max(8, (stat.problems / Math.max(...userStats.weeklyStats.map(s => s.problems))) * 100)}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs mt-1 font-medium">{stat.problems}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ブックマーク問題 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>ブックマーク問題</CardTitle>
            <Badge variant="secondary">{bookmarkedProblems.length}件</Badge>
          </CardHeader>
          <CardContent>
            {bookmarkedProblems.length > 0 ? (
              <div className="space-y-4">
                {bookmarkedProblems.slice(0, 10).map((problem) => (
                  <div key={problem.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{problem.category}</Badge>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= problem.rating ? 'text-yellow-500' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBookmark(problem.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          削除
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{problem.japaneseSentence}</div>
                      <div className="text-gray-600 mt-1">あなたの回答: {problem.userTranslation}</div>
                      <div className="text-green-600 mt-1">模範解答: {problem.correctTranslation}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(problem.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {bookmarkedProblems.length > 10 && (
                  <div className="text-center text-sm text-gray-500">
                    他 {bookmarkedProblems.length - 10} 件のブックマーク
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                ブックマークした問題はありません
              </p>
            )}
          </CardContent>
        </Card>

        {/* データエクスポート */}
        <Card>
          <CardHeader>
            <CardTitle>データエクスポート</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                あなたの学習データ（解答履歴、ブックマーク、統計情報）をJSONファイルとしてダウンロードできます。
              </p>
              <Button onClick={exportData} variant="outline" className="w-full">
                📁 学習データをエクスポート
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}