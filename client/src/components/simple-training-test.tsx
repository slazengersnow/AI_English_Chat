import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SimpleTrainingTestProps {
  onBack: () => void;
}

export function SimpleTrainingTest({ onBack }: SimpleTrainingTestProps) {
  const [problem, setProblem] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const generateProblem = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      console.log("Generating problem...");
      const response = await apiRequest("POST", "/api/problem", {
        difficultyLevel: "toeic",
      });
      const data = await response.json();
      console.log("Problem data:", data);
      setProblem(data.japaneseSentence);
    } catch (err: any) {
      console.error("Problem generation error:", err);
      setError(`問題生成エラー: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!userAnswer.trim() || !problem) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      console.log("Evaluating answer...");
      const response = await apiRequest("POST", "/api/translate", {
        japaneseSentence: problem,
        userTranslation: userAnswer,
        difficultyLevel: "toeic",
      });
      const data = await response.json();
      console.log("Evaluation data:", data);
      setEvaluation(data);
    } catch (err: any) {
      console.error("Evaluation error:", err);
      setError(`評価エラー: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setProblem("");
    setUserAnswer("");
    setEvaluation(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold">シンプル練習テスト</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {!problem && (
          <div className="text-center py-8">
            <Button
              onClick={generateProblem}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "問題生成中..." : "問題を1つ生成"}
            </Button>
          </div>
        )}

        {problem && !evaluation && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-medium text-blue-900 mb-2">問題:</p>
              <p className="text-blue-800">{problem}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                英訳を入力してください:
              </label>
              <Textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="英訳を入力..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={evaluateAnswer}
                disabled={!userAnswer.trim() || isLoading}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                {isLoading ? "評価中..." : "評価する"}
                <Send className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={reset}
                variant="outline"
              >
                リセット
              </Button>
            </div>
          </div>
        )}

        {evaluation && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-900 mb-2">あなたの回答:</p>
              <p className="text-green-800">{userAnswer}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-2">評価結果:</p>
              {evaluation.rating && (
                <p className="text-sm mb-2">評価: {evaluation.rating}/5 ⭐</p>
              )}
              {evaluation.feedback && (
                <p className="text-gray-800 mb-2">{evaluation.feedback}</p>
              )}
              {evaluation.correctTranslation && (
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <p className="font-medium text-blue-900 mb-1">模範解答:</p>
                  <p className="text-blue-800">{evaluation.correctTranslation}</p>
                </div>
              )}
              {evaluation.explanation && (
                <div className="mt-3 p-3 bg-purple-50 rounded">
                  <p className="font-medium text-purple-900 mb-1">解説:</p>
                  <p className="text-purple-800">{evaluation.explanation}</p>
                </div>
              )}
            </div>

            <Button
              onClick={reset}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              新しい問題に挑戦
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}