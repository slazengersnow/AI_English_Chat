import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Send, 
  Star, 
  RotateCcw, 
  CheckCircle,
  Users
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CustomScenario {
  id: number;
  title: string;
  description: string;
}

interface SimulationProblem {
  japaneseSentence: string;
  context: string;
}

interface SimulationResponse {
  correctTranslation: string;
  feedback: string;
  rating: number;
  improvements: string[];
  explanation: string;
  similarPhrases: string[];
}

export default function SimulationPractice() {
  const { id } = useParams();
  const [userTranslation, setUserTranslation] = useState("");
  const [currentProblem, setCurrentProblem] = useState<SimulationProblem | null>(null);
  const [response, setResponse] = useState<SimulationResponse | null>(null);
  const [problemCount, setProblemCount] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  // Get scenario details
  const { data: scenario } = useQuery<CustomScenario>({
    queryKey: [`/api/custom-scenarios/${id}`],
    enabled: !!id,
  });

  // Get simulation problem
  const { data: problemData, refetch: refetchProblem } = useQuery<SimulationProblem>({
    queryKey: [`/api/simulation-problem/${id}`],
    enabled: !!id,
  });

  // Submit translation mutation
  const submitMutation = useMutation({
    mutationFn: async (translation: string) => {
      const response = await fetch("/api/simulation-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: parseInt(id!),
          japaneseSentence: currentProblem?.japaneseSentence,
          userTranslation: translation,
          context: currentProblem?.context || scenario?.description
        })
      });
      if (!response.ok) throw new Error("Failed to submit translation");
      return response.json();
    },
    onSuccess: (data) => {
      setResponse(data);
      setIsSubmitted(true);
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "翻訳の評価に失敗しました",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (problemData) {
      setCurrentProblem(problemData);
    }
  }, [problemData]);

  const handleSubmit = () => {
    if (userTranslation.trim() && currentProblem) {
      submitMutation.mutate(userTranslation.trim());
    }
  };

  const handleNextProblem = () => {
    setUserTranslation("");
    setResponse(null);
    setIsSubmitted(false);
    setProblemCount(prev => prev + 1);
    refetchProblem();
  };

  const handleBackToSelection = () => {
    window.location.href = "/simulation";
  };

  if (!scenario || !currentProblem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>シミュレーションを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBackToSelection}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h1 className="font-semibold">{scenario.title}</h1>
            </div>
          </div>
          <Badge variant="outline">問題 {problemCount}</Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Scenario Context */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">シミュレーション内容</CardTitle>
            <CardDescription>{scenario.description}</CardDescription>
          </CardHeader>
        </Card>

        {/* Problem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                問題 {problemCount}
              </span>
              日本語文を英語に翻訳してください
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-base leading-relaxed text-gray-900 text-center">
                {currentProblem.japaneseSentence}
              </p>
            </div>
            
            {currentProblem.context && (
              <div className="mb-4">
                <p className="text-xs text-gray-600">
                  <strong>シチュエーション:</strong> {currentProblem.context}
                </p>
              </div>
            )}

            {!isSubmitted ? (
              <div className="space-y-4">
                <Textarea
                  placeholder="英語で翻訳を入力してください..."
                  value={userTranslation}
                  onChange={(e) => setUserTranslation(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <Button 
                  onClick={handleSubmit}
                  disabled={!userTranslation.trim() || submitMutation.isPending}
                  className="w-full"
                >
                  {submitMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  翻訳を送信
                </Button>
              </div>
            ) : response && (
              <div className="space-y-4">
                {/* User's answer */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-blue-800 mb-2">あなたの回答</h4>
                  <p className="text-sm leading-relaxed">{userTranslation}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">評価:</span>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < response.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    ({response.rating}/5)
                  </span>
                </div>

                {/* Model answer */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-green-800 mb-2">模範解答</h4>
                  <p className="text-base leading-relaxed text-gray-900 font-medium">{response.correctTranslation}</p>
                </div>

                {/* Feedback */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">フィードバック</h4>
                  <p className="text-sm">{response.feedback}</p>
                </div>

                {/* Explanation */}
                {response.explanation && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">解説</h4>
                    <p className="text-sm">{response.explanation}</p>
                  </div>
                )}

                {/* Improvements */}
                {response.improvements && response.improvements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">改善提案</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {response.improvements.map((improvement, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Similar phrases */}
                {response.similarPhrases && response.similarPhrases.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">類似表現</h4>
                    <div className="space-y-1">
                      {response.similarPhrases.map((phrase, index) => (
                        <div key={index} className="text-sm bg-gray-100 p-2 rounded">
                          {phrase}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next problem button */}
                <Button onClick={handleNextProblem} className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  次の問題へ
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}