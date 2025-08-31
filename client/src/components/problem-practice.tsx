import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Star } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { SpeechButton } from "@/components/speech-button";
import { supabase } from "@/lib/supabase";
import { DIFFICULTY_LEVELS, type DifficultyKey } from "@/lib/constants";

interface ProblemPracticeProps {
  difficulty: DifficultyKey;
  onBack: () => void;
}

// Simple state type
type AppState =
  | "initial"
  | "loading"
  | "problem"
  | "evaluating"
  | "result"
  | "limit_reached"
  | "error";

export function ProblemPractice({ difficulty, onBack }: ProblemPracticeProps) {
  const [state, setState] = useState<AppState>("initial");
  const [problemData, setProblemData] = useState<any>(null);
  const [userInput, setUserInput] = useState("");
  const [evaluation, setEvaluation] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [problemCount, setProblemCount] = useState(0);

  // Check for review problem from sessionStorage
  useEffect(() => {
    const reviewProblemData = sessionStorage.getItem("reviewProblem");
    if (reviewProblemData) {
      try {
        const parsedData = JSON.parse(reviewProblemData);
        console.log("🔄 REVIEW PROBLEM DETECTED:", parsedData);
        
        // Use the complete problem data from review
        setProblemData({
          id: parsedData.id,
          japaneseSentence: parsedData.japaneseSentence,
          userTranslation: parsedData.userTranslation,
          correctTranslation: parsedData.correctTranslation,
          difficultyLevel: parsedData.difficultyLevel,
          rating: parsedData.rating,
          isReview: true,
          isRetry: parsedData.isRetry || false
        });
        
        // CRITICAL: Force problem state immediately
        setState("problem");
        hasStartedRef.current = true;
        sessionStorage.removeItem("reviewProblem");
        
        console.log("✅ REVIEW PROBLEM LOADED - SKIPPING INITIAL STATE");
        
      } catch (error) {
        console.error("Failed to parse review problem data:", error);
        setState("initial");
      }
    } else {
      console.log("ℹ️ No review problem - will show initial state");
    }
  }, []);

  // CRITICAL: Prevent any duplicate execution
  const isExecutingRef = useRef(false);
  const hasStartedRef = useRef(false);

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
      // Skip initial state to prevent showing start button
      hasStartedRef.current = true;
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
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      // For review problems, use existing correct translation
      const modelAnswer = problemData.isReview && problemData.correctTranslation 
        ? problemData.correctTranslation 
        : problemData.modelAnswer || "Standard model answer";
      
      const response = await fetch("/api/evaluate-with-claude", {
        method: "POST",
        headers,
        body: JSON.stringify({
          japaneseSentence: problemData.japaneseSentence,
          userAnswer: userInput,
          userTranslation: userInput,
          modelAnswer: modelAnswer,
          difficultyLevel: problemData.difficultyLevel,
          difficulty: problemData.difficultyLevel,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Evaluation API error:", response.status, errorText);
        throw new Error(`Evaluation failed: ${response.status}`);
      }
      return await response.json();
    },
    retry: false,
    onSuccess: (data) => {
      setEvaluation(data);
      setState("result");
    },
    onError: (error) => {
      console.error("Evaluation mutation error:", error);
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
        {/* Initial State - Manual Start Required */}
        {state === "initial" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <h2 className="text-xl font-semibold mb-4">英作文練習</h2>
            <p className="text-gray-600 mb-6 text-center">
              {difficultyName}レベルの問題で練習します。
              <br />
              準備ができたら下のボタンを押してください。
            </p>
            <Button
              onClick={handleStartPractice}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3"
            >
              練習を開始する
            </Button>
          </div>
        )}

        {/* Loading State */}
        {state === "loading" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">問題を読み込み中...</p>
            </div>
          </div>
        )}

        {/* Problem Display */}
        {state === "problem" && problemData && (
          <div className="flex-1 flex flex-col p-6">
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-sm font-medium text-blue-800 mb-2">日本語</h3>
              <p className="text-lg text-blue-900 font-medium">
                {problemData.japaneseSentence}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                英訳を入力してください
              </label>
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="英語で翻訳を入力..."
                className="min-h-[120px] resize-none"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!userInput.trim()}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3"
            >
              <Send className="h-4 w-4 mr-2" />
              回答を送信
            </Button>
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

        {/* Results Display */}
        {state === "result" && evaluation && (
          <div className="flex-1 flex flex-col p-6">
            <div className="bg-white rounded-lg border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">評価結果</h3>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= (evaluation?.rating || 0)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">
                    模範解答
                  </h4>
                  <p className="text-green-700 bg-green-50 p-3 rounded border-l-4 border-green-400">
                    {evaluation.correctTranslation || evaluation.modelAnswer || problemData.correctTranslation}
                  </p>
                  <SpeechButton text={evaluation.correctTranslation || evaluation.modelAnswer || problemData.correctTranslation} />
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">
                    フィードバック
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {evaluation.feedback}
                  </p>
                </div>

                {evaluation.similarPhrases && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">
                      類似表現
                    </h4>
                    <div className="space-y-2">
                      {evaluation.similarPhrases.map(
                        (phrase: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <p className="text-gray-600">{phrase}</p>
                            <SpeechButton text={phrase} />
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleNextProblem}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3"
            >
              次の問題へ
            </Button>
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
                    setState("initial");
                    hasStartedRef.current = false;
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
