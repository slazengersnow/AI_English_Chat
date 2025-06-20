import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  ResponsiveContainer 
} from "recharts";
import { 
  User, 
  Target, 
  TrendingUp, 
  Calendar, 
  Star, 
  Bookmark, 
  RotateCcw, 
  Plus,
  Edit,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserGoals {
  dailyGoal: number;
  monthlyGoal: number;
}

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

export default function MyPage() {
  const [activeTab, setActiveTab] = useState("progress");
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [goals, setGoals] = useState<UserGoals>({ dailyGoal: 30, monthlyGoal: 900 });
  const [newScenario, setNewScenario] = useState({ title: "", description: "" });
  const [editingScenario, setEditingScenario] = useState<CustomScenario | null>(null);
  const { toast } = useToast();

  // API queries
  const { data: userGoals } = useQuery({
    queryKey: ["/api/user-goals"],
  });

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

  const { data: rechallengeList = [] } = useQuery<TrainingSession[]>({
    queryKey: ["/api/review-sessions", 3],
  });

  const { data: bookmarkedSessions = [] } = useQuery<TrainingSession[]>({
    queryKey: ["/api/bookmarked-sessions"],
  });

  const { data: customScenarios = [] } = useQuery<CustomScenario[]>({
    queryKey: ["/api/custom-scenarios"],
  });

  // Mutations
  const updateGoalsMutation = useMutation({
    mutationFn: async (goals: UserGoals) => {
      const response = await fetch("/api/user-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goals)
      });
      if (!response.ok) throw new Error("Failed to update goals");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "目標を更新しました" });
      queryClient.invalidateQueries({ queryKey: ["/api/user-goals"] });
    }
  });

  const createScenarioMutation = useMutation({
    mutationFn: async (scenario: { title: string; description: string }) => {
      const response = await fetch("/api/custom-scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario)
      });
      if (!response.ok) throw new Error("Failed to create scenario");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "シナリオを作成しました" });
      setNewScenario({ title: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-scenarios"] });
    }
  });

  const updateScenarioMutation = useMutation({
    mutationFn: async ({ id, ...scenario }: { id: number; title: string; description: string }) => {
      const response = await fetch(`/api/custom-scenarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario)
      });
      if (!response.ok) throw new Error("Failed to update scenario");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "シナリオを更新しました" });
      setEditingScenario(null);
      queryClient.invalidateQueries({ queryKey: ["/api/custom-scenarios"] });
    }
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/custom-scenarios/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete scenario");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "シナリオを削除しました" });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-scenarios"] });
    }
  });

  const handleGoalsUpdate = () => {
    updateGoalsMutation.mutate(goals);
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
      'toeic': 'TOEIC',
      'middle-school': '中学英語',
      'high-school': '高校英語', 
      'basic-verbs': '基本動詞',
      'business-email': 'ビジネスメール'
    };
    return names[level as keyof typeof names] || level;
  };

  const formatProgressData = () => {
    return progressData.map(item => ({
      date: new Date(item.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
      problems: item.problemsCompleted,
      rating: item.averageRating
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold">マイページ</h1>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="progress">進捗レポート</TabsTrigger>
            <TabsTrigger value="review">振り返り機能</TabsTrigger>
            <TabsTrigger value="scenarios">シミュレーション作成</TabsTrigger>
          </TabsList>

          {/* 進捗レポート */}
          <TabsContent value="progress" className="space-y-6">
            {/* 目標設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  目標設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dailyGoal">1日の目標</Label>
                    <Input
                      id="dailyGoal"
                      type="number"
                      value={goals.dailyGoal}
                      onChange={(e) => setGoals({...goals, dailyGoal: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyGoal">1ヶ月の目標</Label>
                    <Input
                      id="monthlyGoal"
                      type="number"
                      value={goals.monthlyGoal}
                      onChange={(e) => setGoals({...goals, monthlyGoal: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <Button onClick={handleGoalsUpdate} disabled={updateGoalsMutation.isPending}>
                  目標を更新
                </Button>
              </CardContent>
            </Card>

            {/* 統計情報 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">連続学習日数</CardTitle>
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
                  <CardTitle className="text-sm font-medium">今月の問題数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {(monthlyStats as any)?.totalProblems || 0}問
                  </div>
                  <Progress 
                    value={((monthlyStats as any)?.totalProblems || 0) / goals.monthlyGoal * 100} 
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">平均★評価</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    ★{(monthlyStats as any)?.averageRating || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">今月の平均</p>
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
                  {['day', 'week', 'month'].map((period) => (
                    <Button
                      key={period}
                      variant={selectedPeriod === period ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPeriod(period)}
                    >
                      {period === 'day' ? '日' : period === 'week' ? '週' : '月'}
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
                      <Bar yAxisId="left" dataKey="problems" fill="#3b82f6" name="問題数" />
                      <Line yAxisId="right" type="monotone" dataKey="rating" stroke="#f59e0b" name="★評価" />
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
                    <div key={stat.difficulty} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{getDifficultyName(stat.difficulty)}</div>
                        <div className="text-sm text-muted-foreground">{stat.count}問完了</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">★{stat.averageRating}</span>
                        <Badge variant={stat.averageRating >= 4 ? "default" : "secondary"}>
                          {stat.averageRating >= 4 ? "優秀" : "要改善"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 振り返り機能 */}
          <TabsContent value="review" className="space-y-6">
            {/* 要復習リスト */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-red-500" />
                  要復習リスト（★2以下）
                </CardTitle>
                <CardDescription>
                  評価が低い問題を復習しましょう
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {reviewSessions.map((session) => (
                    <div key={session.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{session.japaneseSentence}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {getDifficultyName(session.difficultyLevel)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({length: session.rating}).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
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
                  もう一度チャレンジしてスコアアップを目指しましょう
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {rechallengeList.map((session) => (
                    <div key={session.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{session.japaneseSentence}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {getDifficultyName(session.difficultyLevel)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({length: session.rating}).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ブックマーク */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-blue-500" />
                  ブックマーク
                </CardTitle>
                <CardDescription>
                  保存した重要な問題
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {bookmarkedSessions.map((session) => (
                    <div key={session.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{session.japaneseSentence}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {getDifficultyName(session.difficultyLevel)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({length: session.rating}).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
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
                    onChange={(e) => setNewScenario({...newScenario, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="description">詳細説明</Label>
                  <Textarea
                    id="description"
                    placeholder="例：プロジェクトの進捗を上司に英語で報告する際に使える表現を練習します。報告内容には成果、課題、今後の予定を含めてください。"
                    value={newScenario.description}
                    onChange={(e) => setNewScenario({...newScenario, description: e.target.value})}
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={handleCreateScenario} 
                  disabled={createScenarioMutation.isPending || !newScenario.title || !newScenario.description}
                >
                  シミュレーションを作成
                </Button>
              </CardContent>
            </Card>

            {/* 作成済みシナリオ一覧 */}
            <Card>
              <CardHeader>
                <CardTitle>作成済みシミュレーション</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customScenarios.map((scenario) => (
                    <div key={scenario.id} className="p-4 border rounded-lg">
                      {editingScenario?.id === scenario.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editingScenario.title}
                            onChange={(e) => setEditingScenario({...editingScenario, title: e.target.value})}
                          />
                          <Textarea
                            value={editingScenario.description}
                            onChange={(e) => setEditingScenario({...editingScenario, description: e.target.value})}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleUpdateScenario}>
                              保存
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingScenario(null)}>
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-medium">{scenario.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{scenario.description}</p>
                              <div className="text-xs text-muted-foreground mt-2">
                                作成日: {new Date(scenario.createdAt).toLocaleDateString('ja-JP')}
                              </div>
                            </div>
                            <div className="flex gap-2">
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
                                onClick={() => handleDeleteScenario(scenario.id)}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}