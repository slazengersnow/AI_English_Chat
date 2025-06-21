import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Plus, Users } from "lucide-react";

interface CustomScenario {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

export default function SimulationSelection() {
  const { data: customScenarios = [] } = useQuery<CustomScenario[]>({
    queryKey: ["/api/custom-scenarios"],
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold">シミュレーション練習</h1>
          </div>
        </div>

        {/* Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>シミュレーション練習について</CardTitle>
            <CardDescription>
              実際の場面を想定した英作文練習ができます。あなたが作成したカスタムシナリオを選んで、実践的な英語表現を身につけましょう。
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Custom Scenarios */}
        {customScenarios.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">作成済みシミュレーション</h2>
            <div className="grid gap-4">
              {customScenarios.map((scenario) => (
                <Card key={scenario.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{scenario.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {scenario.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-4">
                        カスタム
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        作成日: {new Date(scenario.createdAt).toLocaleDateString('ja-JP')}
                      </div>
                      <Link href={`/simulation/${scenario.id}`}>
                        <Button>
                          <Play className="w-4 h-4 mr-2" />
                          練習開始
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">シミュレーションがありません</h3>
              <p className="text-muted-foreground mb-4">
                まずはマイページでオリジナルのシミュレーションを作成しましょう
              </p>
              <Link href="/my-page">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  シミュレーションを作成
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Create New Simulation */}
        {customScenarios.length > 0 && (
          <Card className="mt-6">
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">新しいシミュレーションを作成</h3>
              <p className="text-muted-foreground mb-4">
                マイページでオリジナルのシナリオを追加できます
              </p>
              <Link href="/my-page">
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  マイページへ移動
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}