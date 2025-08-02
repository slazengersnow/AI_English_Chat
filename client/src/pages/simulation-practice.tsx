import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Play, Settings, BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function SimulationPracticePage() {
  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      title: "ビジネス会議",
      description: "会議での発言や議論に関する英語表現",
      problems: 15,
      difficulty: "business"
    },
    {
      id: 2,
      title: "空港・旅行",
      description: "空港や旅行先での実用的な英会話",
      problems: 12,
      difficulty: "travel"
    },
    {
      id: 3,
      title: "レストラン注文",
      description: "レストランでの注文や食事に関する表現",
      problems: 10,
      difficulty: "daily"
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newScenario, setNewScenario] = useState({
    title: "",
    description: "",
    context: ""
  });

  const handleCreateScenario = () => {
    if (!newScenario.title.trim()) return;

    const scenario = {
      id: scenarios.length + 1,
      title: newScenario.title,
      description: newScenario.description,
      problems: 0,
      difficulty: "custom" as const
    };

    setScenarios([...scenarios, scenario]);
    setNewScenario({ title: "", description: "", context: "" });
    setShowCreateForm(false);
  };

  const handleStartScenario = (scenarioId: number) => {
    // In a real app, this would navigate to the scenario practice
    console.log("Starting scenario:", scenarioId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">シミュレーション練習</h1>
            <p className="text-gray-600 mt-1">実際のシーンを想定した英作文練習</p>
          </div>
        </div>

        {!showCreateForm ? (
          <>
            {/* Create New Scenario Button */}
            <div className="mb-8">
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                新しいシナリオを作成
              </Button>
            </div>

            {/* Scenarios Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {scenarios.map((scenario) => (
                <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                      {scenario.title}
                    </CardTitle>
                    <CardDescription>{scenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500">
                        {scenario.problems}問の練習問題
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        scenario.difficulty === 'business' 
                          ? 'bg-purple-100 text-purple-800'
                          : scenario.difficulty === 'travel'
                          ? 'bg-blue-100 text-blue-800'
                          : scenario.difficulty === 'daily'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {scenario.difficulty === 'business' && 'ビジネス'}
                        {scenario.difficulty === 'travel' && '旅行'}
                        {scenario.difficulty === 'daily' && '日常'}
                        {scenario.difficulty === 'custom' && 'カスタム'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleStartScenario(scenario.id)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                        size="sm"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        開始
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          /* Create Scenario Form */
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>新しいシナリオを作成</CardTitle>
              <CardDescription>
                あなただけのカスタムシナリオを作成して、特定の場面での英作文を練習しましょう
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">シナリオ名</label>
                <Input
                  value={newScenario.title}
                  onChange={(e) => setNewScenario({...newScenario, title: e.target.value})}
                  placeholder="例: 病院での診察"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">説明</label>
                <Input
                  value={newScenario.description}
                  onChange={(e) => setNewScenario({...newScenario, description: e.target.value})}
                  placeholder="例: 病院で症状を説明する際の英語表現"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">詳細設定</label>
                <Textarea
                  value={newScenario.context}
                  onChange={(e) => setNewScenario({...newScenario, context: e.target.value})}
                  placeholder="このシナリオで想定される具体的な状況や、練習したい表現を詳しく入力してください..."
                  className="min-h-[120px]"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleCreateScenario}
                  disabled={!newScenario.title.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  シナリオを作成
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  キャンセル
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}