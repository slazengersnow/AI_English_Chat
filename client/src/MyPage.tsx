import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';

interface DailyStats {
  streak: number;
  todayProblems: number;
  monthlyProblems: number;
  averageRating: number;
  dailyLimit: number;
}

interface PlanInfo {
  currentPlan: string;
  monthlyFee: number;
  yearlyFee: number;
  features: string[];
  nextBilling: string;
}

interface UserAccount {
  email: string;
  registeredAt: string;
}

export default function MyPage({ onBackToMenu, onStartTraining, onShowAuth }: { 
  onBackToMenu: () => void;
  onStartTraining: (problem: string) => void;
  onShowAuth?: () => void;
}) {
  // Record current page as my page for refresh persistence
  useEffect(() => {
    localStorage.setItem('englishTrainingCurrentPage', 'mypage');
  }, []);

  const [dailyStats, setDailyStats] = useState<DailyStats>({
    streak: 0,
    todayProblems: 0,
    monthlyProblems: 0,
    averageRating: 0,
    dailyLimit: 100
  });
  const [planInfo, setPlanInfo] = useState<PlanInfo>({
    currentPlan: 'スタンダード',
    monthlyFee: 980,
    yearlyFee: 9800,
    features: [],
    nextBilling: '2025/08/13'
  });
  const [userAccount, setUserAccount] = useState<UserAccount>({
    email: '',
    registeredAt: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [reviewList, setReviewList] = useState<any[]>([]);
  const [retryList, setRetryList] = useState<any[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    loadBookmarks();
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    setReviewLoading(true);
    try {
      const [reviewResponse, retryResponse] = await Promise.all([
        fetch('/api/review-list'),
        fetch('/api/retry-list')
      ]);
      
      if (reviewResponse.ok) {
        const reviewData = await reviewResponse.json();
        setReviewList(reviewData || []);
      } else {
        console.warn('Failed to load review list:', reviewResponse.status);
        setReviewList([]);
      }
      
      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        setRetryList(retryData || []);
      } else {
        console.warn('Failed to load retry list:', retryResponse.status);
        setRetryList([]);
      }
    } catch (error) {
      console.error('Failed to load review data:', error);
      setReviewList([]);
      setRetryList([]);
    } finally {
      setReviewLoading(false);
    }
  };

  const loadBookmarks = () => {
    const savedBookmarks = localStorage.getItem('englishTrainingBookmarks');
    if (savedBookmarks) {
      try {
        const bookmarksArray = JSON.parse(savedBookmarks);
        setBookmarks(bookmarksArray);
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
      }
    }
  };

  const removeBookmark = (bookmarkToRemove: string) => {
    const updatedBookmarks = bookmarks.filter(bookmark => bookmark !== bookmarkToRemove);
    setBookmarks(updatedBookmarks);
    localStorage.setItem('englishTrainingBookmarks', JSON.stringify(updatedBookmarks));
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch real progress data from API
      const progressResponse = await fetch('/api/progress-report');
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setDailyStats({
          streak: progressData.streak || 0,
          monthlyProblems: progressData.monthlyProblems || 0,
          averageRating: parseFloat(progressData.averageRating) || 0,
          todayProblems: progressData.todayProblems || 0,
          dailyLimit: progressData.dailyLimit || 50
        });
      } else {
        console.warn('Failed to load progress data, using defaults');
        setDailyStats({
          streak: 0,
          monthlyProblems: 0,
          averageRating: 0,
          todayProblems: 0,
          dailyLimit: 50
        });
      }

      // Update plan information based on membership
      const membershipType = progressData?.membershipType || 'standard';
      setPlanInfo({
        currentPlan: membershipType === 'premium' ? 'プレミアム' : 'スタンダード',
        monthlyFee: membershipType === 'premium' ? 1980 : 980,
        yearlyFee: membershipType === 'premium' ? 19800 : 9800,
        features: membershipType === 'premium' ? [
          '月間利用 制限なし',
          '1日の練習回数上限 100問',
          '繰り返し練習 ○',
          'シミュレーション練習 ○',
          '進捗レポート ○',
          'ブックマーク機能 ○',
          '音声読み上げ ○'
        ] : [
          '月間利用 100問',
          '1日の練習回数上限 50問',
          '繰り返し練習 ×',
          'シミュレーション練習 ×',
          '進捗レポート ×',
          'ブックマーク機能 ×',
          '音声読み上げ ×'
        ],
        nextBilling: '2025/08/13'
      });

      // Mock user account
      setUserAccount({
        email: 'slazengersnow@gmail.com',
        registeredAt: '会員登録アカウント'
      });

    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = () => {
    alert('解約手続きを開始します');
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onBackToMenu}
              className="text-gray-500 hover:text-gray-700"
            >
              ←
            </button>
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
              <span className="text-sm">A</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">マイページ</h1>
          </div>
          <button 
            onClick={onBackToMenu}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
          >
            <span>🏠</span>
            <span>トップページ</span>
          </button>
        </div>

        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white rounded-lg p-1">
            <TabsTrigger value="progress" className="text-sm">進捗レポート</TabsTrigger>
            <TabsTrigger value="bookmarks" className="text-sm">ブックマーク</TabsTrigger>
            <TabsTrigger value="practice" className="text-sm">繰り返し練習</TabsTrigger>
            <TabsTrigger value="simulation" className="text-sm">シミュレーション</TabsTrigger>
            <TabsTrigger value="account" className="text-sm">アカウント</TabsTrigger>
          </TabsList>

          {/* Progress Report Tab */}
          <TabsContent value="progress">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Streak Days */}
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 mb-1">連続学習日数</div>
                  <div className="text-3xl font-bold text-green-600">{dailyStats.streak}日</div>
                  <div className="text-xs text-gray-500">連続頑張り中！</div>
                </CardContent>
              </Card>

              {/* Monthly Problems */}
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 mb-1">今月の問題数</div>
                  <div className="text-3xl font-bold text-blue-600">{dailyStats.monthlyProblems}問</div>
                  <div className="text-xs text-gray-500">今月の実績</div>
                </CardContent>
              </Card>

              {/* Average Rating */}
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 mb-1">平均★評価</div>
                  <div className="text-3xl font-bold text-yellow-600">★{dailyStats.averageRating}</div>
                  <div className="text-xs text-gray-500">今月の平均</div>
                </CardContent>
              </Card>

              {/* Today Problems */}
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 mb-1">今日の問題数</div>
                  <div className="text-3xl font-bold text-orange-600">{dailyStats.todayProblems}/{dailyStats.dailyLimit}</div>
                  <div className="text-xs text-gray-500">残り {dailyStats.dailyLimit - dailyStats.todayProblems}問</div>
                </CardContent>
              </Card>
            </div>


          </TabsContent>

          {/* Repetitive Practice Tab */}
          <TabsContent value="practice">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Review List (★2以下) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <span>要復習リスト (★2以下)</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">評価が低かった問題を再度挑戦して理解を深めましょう</p>
                </CardHeader>
                <CardContent>
                  {reviewLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : reviewList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🎉</div>
                      <p>要復習の問題はありません！</p>
                      <p className="text-sm">素晴らしい成績です</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reviewList.slice(0, 10).map((item, index) => (
                        <div 
                          key={item.id || index} 
                          className="bg-red-50 border border-red-200 rounded-lg p-3 hover:bg-red-100 cursor-pointer transition-colors"
                          onClick={() => onStartTraining(item.japaneseSentence)}
                        >
                          <div className="text-gray-800 font-medium">{item.japaneseSentence}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Retry List (★3) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-orange-500">🔄</span>
                    <span>再挑戦リスト (★3)</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">もう一度挑戦して更なる向上を目指しましょう</p>
                </CardHeader>
                <CardContent>
                  {reviewLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : retryList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">✨</div>
                      <p>再挑戦の問題はありません！</p>
                      <p className="text-sm">全て高評価でした</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {retryList.slice(0, 10).map((item, index) => (
                        <div 
                          key={item.id || index} 
                          className="bg-orange-50 border border-orange-200 rounded-lg p-3 hover:bg-orange-100 cursor-pointer transition-colors"
                          onClick={() => onStartTraining(item.japaneseSentence)}
                        >
                          <div className="text-gray-800 font-medium">{item.japaneseSentence}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📚</span>
                  <span>ブックマークした問題</span>
                </CardTitle>
                <p className="text-sm text-gray-600">重要な問題や復習したい問題をブックマークして管理</p>
              </CardHeader>
              <CardContent>
                {bookmarks.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <span>📖</span>
                    </div>
                    <p className="font-medium">ブックマークした問題がありません</p>
                    <p className="text-sm">練習中に重要な問題をブックマークしてみましょう</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 mb-4">
                      ブックマーク済み: {bookmarks.length}件
                    </div>
                    {bookmarks.map((bookmark, index) => {
                      const [problem, number] = bookmark.split('_');
                      return (
                        <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:bg-yellow-100 transition-colors">
                          <div className="flex items-start justify-between">
                            <div 
                              className="flex-1 cursor-pointer" 
                              onClick={() => onStartTraining(problem)}
                            >
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-yellow-500">⭐</span>
                                <span className="text-sm font-medium text-gray-700">問題 {number || index + 1}</span>
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">再挑戦</span>
                              </div>
                              <div className="text-gray-800 font-medium hover:text-blue-600 transition-colors">{problem}</div>
                              <div className="text-xs text-gray-500 mt-1">クリックして再度練習する</div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBookmark(bookmark);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                              title="ブックマークを削除"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>



          {/* Simulation Tab */}
          <TabsContent value="simulation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>➕</span>
                  <span>シミュレーション作成</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <p className="font-medium text-yellow-800 mb-2">この機能はプレミアムプラン限定です。</p>
                  <p className="text-sm text-yellow-700">リアルなビジネスシーンを想定したシミュレーション練習を体験したい方は、プレミアムプランをご検討ください。</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <div className="space-y-6">
              {/* Current Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>💎</span>
                    <span>現在のプラン</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">ご利用中のサブスクリプションプランの詳細</p>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-4">
                    <div>
                      <p className="font-medium text-gray-900">スタンダードプラン</p>
                      <p className="text-sm text-gray-600">基本機能 50問/月</p>
                    </div>
                    <Badge>スタンダード</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Plan Upgrade */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>✅</span>
                    <span>プラン変更</span>
                  </CardTitle>

                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">プレミアムプランにアップグレード</span>
                      <Button variant="outline" size="sm">アップグレード</Button>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">年会費プランに変更</span>
                      <Button variant="outline" size="sm">年会費に変更</Button>
                    </div>
                    <p className="text-sm text-gray-600">月額プランから12ヶ月プランに変更（2ヶ月分お得）</p>
                  </div>
                </CardContent>
              </Card>

              {/* Plan Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>📊</span>
                    <span>プラン比較</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">スタンダードプラン・プレミアムプランの機能比較</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-orange-50 border-b">
                          <th className="text-left py-2 font-bold">機能</th>
                          <th className="text-center py-2 font-bold">スタンダードプラン</th>
                          <th className="text-center py-2 font-bold">プレミアムプラン</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-gray-50 border-b">
                          <td className="py-2">月額料金</td>
                          <td className="text-center">980円</td>
                          <td className="text-center">1,300円</td>
                        </tr>
                        <tr className="bg-white border-b">
                          <td className="py-2">年会費（2ヶ月分割引）</td>
                          <td className="text-center">9,800円</td>
                          <td className="text-center">13,000円</td>
                        </tr>
                        <tr className="bg-gray-50 border-b">
                          <td className="py-2">1日の練習回数上限</td>
                          <td className="text-center">50問</td>
                          <td className="text-center">100問</td>
                        </tr>
                        <tr className="bg-white border-b">
                          <td className="py-2">繰り返し練習</td>
                          <td className="text-center">×</td>
                          <td className="text-center">✓</td>
                        </tr>
                        <tr className="bg-gray-50 border-b">
                          <td className="py-2">シミュレーション練習</td>
                          <td className="text-center">×</td>
                          <td className="text-center">✓</td>
                        </tr>
                        <tr className="bg-white border-b">
                          <td className="py-2">進捗レポート</td>
                          <td className="text-center">✓</td>
                          <td className="text-center">✓</td>
                        </tr>
                        <tr className="bg-gray-50 border-b">
                          <td className="py-2">ブックマーク機能</td>
                          <td className="text-center">✓</td>
                          <td className="text-center">✓</td>
                        </tr>
                        <tr className="bg-white border-b">
                          <td className="py-2">音声読み上げ</td>
                          <td className="text-center">✓</td>
                          <td className="text-center">✓</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>💳</span>
                    <span>支払い管理</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">課金履歴・残高確認・カード情報の確認</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>次回請求日</span>
                    <span>{planInfo.nextBilling}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>請求金額</span>
                    <span>月額1,300円</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      💳 請求履歴を確認
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      🔄 支払い方法を変更
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Cancellation */}
              <Card>
                <CardContent className="p-6">
                  <Button 
                    onClick={cancelSubscription}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    サブスクリプションを解約
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    解約はいつでも行えますのでお気軽にお試しください
                  </p>
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>👤</span>
                    <span>アカウント情報</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">ログイン情報・アカウント管理</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center">
                      <span>S</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{userAccount.email}</p>
                      <p className="text-sm text-gray-600">{userAccount.registeredAt}</p>
                    </div>
                    <Button variant="outline" size="sm">変更前</Button>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t text-center">
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => {
                        // Clear any stored data
                        localStorage.clear();
                        sessionStorage.clear();
                        
                        // If onShowAuth is provided, show auth screen
                        if (onShowAuth) {
                          onShowAuth();
                        } else {
                          // Fallback: reload page
                          window.location.reload();
                        }
                      }}
                    >
                      ログアウト
                    </Button>
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