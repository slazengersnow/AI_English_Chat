import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Star } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { SpeechButton } from "@/components/speech-button";
import { DIFFICULTY_LEVELS, type DifficultyKey } from "@/lib/constants";

interface ProblemPracticeProps {
  difficulty: DifficultyKey;
  onBack: () => void;
}

// Simple state type
type AppState =
  | "loading"
  | "problem"
  | "evaluating"
  | "result"
  | "limit_reached"
  | "error";

export function ProblemPractice({ difficulty, onBack }: ProblemPracticeProps) {
  const [state, setState] = useState<AppState>("loading");
  const [problemData, setProblemData] = useState<any>(null);
  const [userInput, setUserInput] = useState("");
  const [evaluation, setEvaluation] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [problemCount, setProblemCount] = useState(0);

  // CRITICAL: Prevent any duplicate execution
  const isExecutingRef = useRef(false);
  const hasStartedRef = useRef(false);

  // Auto-start when component mounts
  useEffect(() => {
    if (!hasStartedRef.current && !isExecutingRef.current) {
      hasStartedRef.current = true;
      generateMutation.mutate();
    }
  }, []);

  // Problem generation - STRICT SINGLE EXECUTION
  const generateMutation = useMutation({
    mutationFn: async () => {
      console.log("🔥 GENERATE MUTATION: Starting execution");

      // ABSOLUTE BLOCK: Prevent any double execution
      if (isExecutingRef.current) {
        console.log("🛑 BLOCKED: Already executing");
        throw new Error("EXECUTION_BLOCKED");
      }

      // ✅ Set flag BEFORE try-catch-finally block
      isExecutingRef.current = true;

      try {
        const response = await fetch("/api/problem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficultyLevel: difficulty }),
        });

        console.log("📡 RESPONSE STATUS:", response.status);

        if (response.status === 429) {
          const data = await response.json();
          console.log("🛑 429 ERROR - DAILY LIMIT:", data);
          throw new Error("DAILY_LIMIT_REACHED");
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API ERROR:", response.status, errorText);
          throw new Error(`API_ERROR_${response.status}`);
        }

        const data = await response.json();
        console.log("✅ SUCCESS:", data);
        return data;
      } catch (err) {
        throw err;
      } finally {
        isExecutingRef.current = false;
      }
    },
    retry: false,
    onSuccess: (data) => {
      console.log("✅ MUTATION SUCCESS");
      setProblemData(data);
      setProblemCount((prev) => prev + 1);
      setState("problem");
    },
    onError: (error: any) => {
      console.log("🛑 MUTATION ERROR:", error.message);

      if (error.message === "DAILY_LIMIT_REACHED") {
        setState("limit_reached");
      } else if (error.message === "EXECUTION_BLOCKED") {
        console.log("🛑 DUPLICATE EXECUTION BLOCKED");
        // Don't change state for blocked executions
      } else {
        setErrorMessage("問題の生成に失敗しました。");
        setState("error");
      }
    },
  });

  // Evaluation mutation
  const evaluateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          japaneseSentence: problemData.japaneseSentence,
          userTranslation: userInput,
          difficultyLevel: difficulty,
        }),
      });

      if (!response.ok) throw new Error("Evaluation failed");
      return await response.json();
    },
    retry: false,
    onSuccess: (data) => {
      setEvaluation(data);
      setState("result");
    },
    onError: () => {
      setErrorMessage("評価に失敗しました。");
      setState("error");
    },
  });

  // MANUAL BUTTON FUNCTIONS ONLY
  const handleStartPractice = () => {
    console.log("🚀 START BUTTON CLICKED");

    if (hasStartedRef.current) {
      console.log("🛑 ALREADY STARTED");
      return;
    }

    if (isExecutingRef.current) {
      console.log("🛑 EXECUTION IN PROGRESS");
      return;
    }

    hasStartedRef.current = true;
    setState("loading");
    generateMutation.mutate();
  };

  const handleSubmit = () => {
    if (!userInput.trim()) return;
    setState("evaluating");
    evaluateMutation.mutate();
  };

  const handleNextProblem = () => {
    console.log("🔄 NEXT BUTTON CLICKED");

    if (isExecutingRef.current) {
      console.log("🛑 EXECUTION IN PROGRESS");
      return;
    }

    setUserInput("");
    setEvaluation(null);
    setProblemData(null);
    setState("loading");
    generateMutation.mutate();
  };

  const difficultyName = DIFFICULTY_LEVELS[difficulty]?.name || difficulty;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-lg">{difficultyName}</h1>
            {problemCount > 0 && (
              <p className="text-sm text-gray-500">問題 #{problemCount}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">

        {/* Loading State */}
        {state === "loading" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">問題を読み込み中...</p>
            </div>
          </div>
        )}

        {/* Problem Display - Redesigned to Match Ideal Interface */}
        {state === "problem" && problemData && (
          <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100">
            <div className="flex-1 p-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6 border">
                <h3 className="text-sm font-medium text-blue-800 mb-2">日本語</h3>
                <p className="text-xl text-blue-900 font-medium leading-relaxed">
                  {problemData.japaneseSentence}
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  英訳を入力してください
                </label>
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="英語で翻訳を入力..."
                  className="min-h-[120px] resize-none border-2 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-4 bg-white border-t">
              <Button
                onClick={handleSubmit}
                disabled={!userInput.trim()}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg"
              >
                <Send className="h-4 w-4 mr-2" />
                回答を送信
              </Button>
            </div>
          </div>
        )}

        {/* Evaluating State */}
        {state === "evaluating" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">評価中...</p>
            </div>
          </div>
        )}

        {/* Results Display - Redesigned to Match Ideal Interface */}
        {state === "result" && evaluation && (
          <div className="flex-1 flex flex-col">
            {/* Chat-style evaluation display */}
            <div className="flex-1 bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100 p-4 space-y-4">
              
              {/* Rating Display */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-3">評価結果</h3>
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 ${
                          star <= (evaluation?.rating || 0)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    良好な翻訳です
                  </p>
                </div>
              </div>

              {/* Model Answer */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">解説</h4>
                  <SpeechButton text={evaluation.modelAnswer} className="bg-green-500 hover:bg-green-600 text-white" />
                </div>
                <div className="space-y-3">
                  <div className="bg-green-50 rounded p-3 border-l-4 border-green-400">
                    <p className="text-sm font-medium text-green-800 mb-1">模範解答</p>
                    <p className="text-green-700 font-medium">{evaluation.modelAnswer}</p>
                  </div>
                  
                  {evaluation.similarPhrases && evaluation.similarPhrases.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2 font-medium">類似フレーズ</p>
                      <div className="space-y-2">
                        {evaluation.similarPhrases.map((phrase: string, index: number) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                            <span className="text-sm text-gray-700">• {phrase}</span>
                            <SpeechButton text={phrase} className="bg-purple-500 hover:bg-purple-600 text-white" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Feedback */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
                <h4 className="font-medium text-gray-700 mb-2">詳細フィードバック</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {evaluation.feedback}
                </p>
              </div>
            </div>

            {/* Next Problem Button */}
            <div className="p-4 bg-white border-t">
              <Button
                onClick={handleNextProblem}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg"
              >
                次の問題へ
              </Button>
            </div>
          </div>
        )}

        {/* Daily Limit Reached */}
        {state === "limit_reached" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-4">
                本日の学習完了
              </h2>
              <p className="text-gray-600 mb-6">
                本日の最大出題数（100問）に達しました。
                <br />
                明日またお試しください。
              </p>
              <Button onClick={onBack} variant="outline">
                戻る
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-4">
                エラーが発生しました
              </h2>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <div className="space-x-3">
                <Button
                  onClick={() => {
                    setState("loading");
                    hasStartedRef.current = false;
                    generateMutation.mutate();
                  }}
                  variant="outline"
                >
                  最初から
                </Button>
                <Button onClick={onBack} variant="outline">
                  戻る
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
