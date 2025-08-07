import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PersonalStats {
  totalProblems: number;
  averageRating: number;
  streakDays: number;
  categoryBreakdown: Record<string, number>;
  monthlyProgress: Array<{ month: string; problems: number; averageRating: number }>;
}

interface BookmarkedProblem {
  id: string;
  japaneseSentence: string;
  modelAnswer: string;
  category: string;
  bookmarkedAt: string;
  personalRating?: number;
}

interface Goal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  target: number;
  current: number;
  description: string;
}

export default function MyPage({ onBackToMenu }: { onBackToMenu: () => void }) {
  const [personalStats, setPersonalStats] = useState<PersonalStats>({
    totalProblems: 0,
    averageRating: 0,
    streakDays: 0,
    categoryBreakdown: {},
    monthlyProgress: []
  });
  const [bookmarkedProblems, setBookmarkedProblems] = useState<BookmarkedProblem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Mock personal statistics
      setPersonalStats({
        totalProblems: 287,
        averageRating: 3.8,
        streakDays: 12,
        categoryBreakdown: {
          'TOEIC': 89,
          '中学英語': 76,
          '高校英語': 64,
          '基本動詞': 34,
          'ビジネスメール': 24
        },
        monthlyProgress: [
          { month: '6月', problems: 98, averageRating: 3.6 },
          { month: '7月', problems: 134, averageRating: 3.9 },
          { month: '8月', problems: 55, averageRating: 4.1 }
        ]
      });

      // Mock bookmarked problems
      setBookmarkedProblems([
        {
          id: '1',
          japaneseSentence: 'このデータを分析してください。',
          modelAnswer: 'Please analyze this data.',
          category: 'ビジネスメール',
          bookmarkedAt: '2025-08-05',
          personalRating: 2
        },
        {
          id: '2', 
          japaneseSentence: '明日の会議に参加できません。',
          modelAnswer: 'I cannot attend tomorrow\'s meeting.',
          category: 'ビジネスメール',
          bookmarkedAt: '2025-08-03',
          personalRating: 3
        },
        {
          id: '3',
          japaneseSentence: '予算の承認が必要です。',
          modelAnswer: 'Budget approval is required.',
          category: 'TOEIC',
          bookmarkedAt: '2025-08-01',
          personalRating: 4
        }
      ]);

      // Mock personal goals
      setGoals([
        { id: '1', type: 'daily', target: 20, current: 12, description: '1日20問' },
        { id: '2', type: 'weekly', target: 120, current: 78, description: '週120問' },
        { id: '3', type: 'monthly', target: 500, current: 287, description: '月500問' }
      ]);

    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      personalStats,
      bookmarkedProblems,
      goals,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_english_training_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeBookmark = (problemId: string) => {
    setBookmarkedProblems(prev => prev.filter(p => p.id !== problemId));
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-blue-600';
    if (rating >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">マイページ</h1>
                <p className="text-sm text-gray-600">学習状況と目標管理</p>
              </div>
            </div>
            <button 
              onClick={onBackToMenu}
              className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              ← メニューに戻る
            </button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="progress">進捗</TabsTrigger>
            <TabsTrigger value="bookmarks">ブックマーク</TabsTrigger>
            <TabsTrigger value="settings">設定</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Overall Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">総合統計</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{personalStats.totalProblems}</div>
                    <p className="text-sm text-gray-600">解答済み問題数</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{personalStats.averageRating.toFixed(1)}</div>
                    <p className="text-sm text-gray-600">平均評価</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{personalStats.streakDays}</div>
                    <p className="text-sm text-gray-600">連続学習日数</p>
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">カテゴリ別進捗</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(personalStats.categoryBreakdown).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{category}</span>
                      <Badge variant="secondary">{count}問</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Goals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">目標達成状況</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {goals.map((goal) => {
                    const percentage = Math.min((goal.current / goal.target) * 100, 100);
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">{goal.description}</span>
                          <span className="text-sm text-gray-600">{goal.current}/{goal.target}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(percentage)}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">月別進捗</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {personalStats.monthlyProgress.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold">{month.month}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{month.problems}問解答</p>
                          <p className="text-sm text-gray-600">平均評価: {month.averageRating.toFixed(1)}/5</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="secondary" 
                          className={getRatingColor(month.averageRating)}
                        >
                          {month.averageRating >= 4 ? '優秀' : month.averageRating >= 3 ? '良好' : '要改善'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ブックマーク問題 ({bookmarkedProblems.length}件)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookmarkedProblems.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">ブックマーク問題はありません</p>
                  ) : (
                    bookmarkedProblems.map((problem) => (
                      <div key={problem.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium">{problem.japaneseSentence}</p>
                            <p className="text-gray-600 text-sm mt-1">{problem.modelAnswer}</p>
                          </div>
                          <button
                            onClick={() => removeBookmark(problem.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-2">
                            <Badge variant="outline">{problem.category}</Badge>
                            {problem.personalRating && (
                              <Badge variant="secondary">
                                評価: {problem.personalRating}/5
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{problem.bookmarkedAt}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">データ管理</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={exportData} className="w-full">
                    📥 学習データをエクスポート
                  </Button>
                  <p className="text-sm text-gray-600">
                    学習履歴、ブックマーク、統計データをJSONファイルでダウンロードできます。
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">学習設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">1日の目標問題数</label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="10">10問</option>
                      <option value="20" selected>20問</option>
                      <option value="30">30問</option>
                      <option value="50">50問</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">通知設定</label>
                    <div className="space-y-1">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span className="text-sm">毎日の学習リマインダー</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">週次進捗レポート</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}