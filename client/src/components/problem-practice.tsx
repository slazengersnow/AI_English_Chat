import React, { useReducer, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Star, Bookmark, BookmarkCheck } from "lucide-react";
import { useApiMutation } from "@/lib/queryClient";
import { SpeechButton } from "@/components/speech-button";
import { DIFFICULTY_LEVELS, type DifficultyKey } from "@/lib/constants";

interface ProblemPracticeProps {
  difficulty: DifficultyKey;
  onBack: () => void;
}

// State management with useReducer
type ProblemState = {
  step: "loading" | "show_problem" | "waiting_user_input" | "evaluating" | "show_result" | "daily_limit" | "error";
  japaneseSentence: string;
  userTranslation: string;
  evaluation: any;
  dailyLimitReached: boolean;
  error: string | null;
  problemCount: number;
};

type ProblemAction = 
  | { type: "START_LOADING" }
  | { type: "PROBLEM_LOADED"; problem: string }
  | { type: "USER_INPUT"; input: string }
  | { type: "START_EVALUATION" }
  | { type: "EVALUATION_LOADED"; evaluation: any }
  | { type: "SET_DAILY_LIMIT" }
  | { type: "SET_ERROR"; error: string }
  | { type: "RESET_FOR_NEXT" };

const initialState: ProblemState = {
  step: "loading",
  japaneseSentence: "",
  userTranslation: "",
  evaluation: null,
  dailyLimitReached: false,
  error: null,
  problemCount: 0,
};

function problemReducer(state: ProblemState, action: ProblemAction): ProblemState {
  switch (action.type) {
    case "START_LOADING":
      return { ...state, step: "loading", error: null };
    case "PROBLEM_LOADED":
      return { 
        ...state, 
        step: "show_problem", 
        japaneseSentence: action.problem,
        problemCount: state.problemCount + 1,
        error: null 
      };
    case "USER_INPUT":
      return { ...state, userTranslation: action.input };
    case "START_EVALUATION":
      return { ...state, step: "evaluating" };
    case "EVALUATION_LOADED":
      return { ...state, step: "show_result", evaluation: action.evaluation };
    case "SET_DAILY_LIMIT":
      return { ...state, step: "daily_limit", dailyLimitReached: true };
    case "SET_ERROR":
      return { ...state, step: "error", error: action.error };
    case "RESET_FOR_NEXT":
      return {
        ...state,
        step: "loading",
        japaneseSentence: "",
        userTranslation: "",
        evaluation: null,
        error: null,
      };
    default:
      return state;
  }
}

export function ProblemPractice({ difficulty, onBack }: ProblemPracticeProps) {
  const [state, dispatch] = useReducer(problemReducer, initialState);
  const isInitialized = useRef(false);
  const isGeneratingRef = useRef(false);

  // CRITICAL: Global flag to prevent any duplicate calls
  const isProcessingRef = useRef(false);
  
  // Problem generation mutation - MANUAL TRIGGER ONLY WITH ABSOLUTE PROTECTION
  const generateProblem = useApiMutation<any, { difficultyLevel: string }>(
    async ({ difficultyLevel }) => {
      console.log("🔥 MUTATION START: generateProblem called with:", difficultyLevel);
      
      // ABSOLUTE PROTECTION - Multiple checks
      if (isProcessingRef.current) {
        console.log("🛑 ABORT: Already processing, blocking duplicate call");
        throw new Error("DUPLICATE_CALL_BLOCKED");
      }
      
      if (isGeneratingRef.current) {
        console.log("🛑 ABORT: Generation in progress, blocking call");
        throw new Error("GENERATION_IN_PROGRESS");
      }
      
      if (state.dailyLimitReached) {
        console.log("🛑 ABORT: Daily limit reached, blocking call");
        throw new Error("DAILY_LIMIT_REACHED");
      }
      
      // Set all flags to prevent any other execution
      isProcessingRef.current = true;
      isGeneratingRef.current = true;
      
      try {
        console.log("📡 API CALL: Sending request to /api/problem");
        const response = await fetch("/api/problem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficultyLevel }),
        });

        console.log("📡 API RESPONSE: Status =", response.status);

        // CRITICAL: Handle 429 errors by throwing - DO NOT RETURN NULL
        if (response.status === 429) {
          const data = await response.json();
          console.log("🛑 429 ERROR: Daily limit reached, server response:", data);
          
          if (data.dailyLimitReached) {
            console.log("🛑 DAILY LIMIT CONFIRMED: Throwing error to stop mutation");
            throw new Error("DAILY_LIMIT_429");
          }
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API ERROR:", response.status, errorText);
          throw new Error(`API_ERROR_${response.status}`);
        }

        const data = await response.json();
        console.log("✅ SUCCESS: Problem data received:", data);
        
        // Final check for daily limit in successful response
        if (data.dailyLimitReached) {
          console.log("🛑 DAILY LIMIT IN DATA: Throwing error");
          throw new Error("DAILY_LIMIT_IN_DATA");
        }

        return data;
      } finally {
        // Always release flags
        isProcessingRef.current = false;
        isGeneratingRef.current = false;
        console.log("🔓 FLAGS RELEASED: Processing complete");
      }
    }
  );

  // Translation evaluation mutation
  const evaluateTranslation = useApiMutation<any, { 
    japaneseSentence: string; 
    userTranslation: string; 
    difficultyLevel: string; 
  }>(
    async ({ japaneseSentence, userTranslation, difficultyLevel }) => {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ japaneseSentence, userTranslation, difficultyLevel }),
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }

      return await response.json();
    }
  );

  // Handle problem generation result
  useEffect(() => {
    if (generateProblem.isSuccess && generateProblem.data) {
      console.log("✅ MUTATION SUCCESS: Problem loaded");
      dispatch({ 
        type: "PROBLEM_LOADED", 
        problem: generateProblem.data.japaneseSentence 
      });
    }
  }, [generateProblem.isSuccess, generateProblem.data]);

  // Handle problem generation error - INCLUDING DAILY LIMIT
  useEffect(() => {
    if (generateProblem.isError) {
      const error = generateProblem.error as Error;
      console.log("🛑 MUTATION ERROR:", error.message);
      
      // Handle specific error types
      if (error.message === "DAILY_LIMIT_429" || 
          error.message === "DAILY_LIMIT_REACHED" || 
          error.message === "DAILY_LIMIT_IN_DATA") {
        console.log("🛑 DAILY LIMIT ERROR: Setting daily limit state");
        dispatch({ type: "SET_DAILY_LIMIT" });
      } else if (error.message === "DUPLICATE_CALL_BLOCKED" || 
                 error.message === "GENERATION_IN_PROGRESS") {
        console.log("🛑 DUPLICATE CALL: Ignoring duplicate execution");
        // Don't change state for duplicate calls
      } else {
        console.log("❌ GENERAL ERROR: Setting error state");
        dispatch({ 
          type: "SET_ERROR", 
          error: "問題の読み込みに失敗しました。" 
        });
      }
    }
  }, [generateProblem.isError, generateProblem.error]);

  // Handle evaluation result
  useEffect(() => {
    if (evaluateTranslation.isSuccess && evaluateTranslation.data) {
      dispatch({ 
        type: "EVALUATION_LOADED", 
        evaluation: evaluateTranslation.data 
      });
    }
  }, [evaluateTranslation.isSuccess, evaluateTranslation.data]);

  // Handle evaluation error
  useEffect(() => {
    if (evaluateTranslation.isError) {
      dispatch({ 
        type: "SET_ERROR", 
        error: "評価の生成に失敗しました。" 
      });
    }
  }, [evaluateTranslation.isError]);

  // Manual problem loading function - BUTTON TRIGGERED ONLY WITH PROTECTION
  const loadNewProblem = () => {
    console.log("🚀 BUTTON CLICK: Manual problem load triggered");
    
    // Multiple protection layers
    if (state.dailyLimitReached) {
      console.log("🛑 BUTTON BLOCKED: Daily limit already reached");
      return;
    }
    
    if (isProcessingRef.current || isGeneratingRef.current) {
      console.log("🛑 BUTTON BLOCKED: Already processing request");
      return;
    }

    if (generateProblem.isPending) {
      console.log("🛑 BUTTON BLOCKED: Mutation still pending");
      return;
    }

    console.log("✅ BUTTON APPROVED: Starting problem generation");
    dispatch({ type: "START_LOADING" });
    generateProblem.mutate({ difficultyLevel: difficulty });
  };

  const handleSubmitTranslation = () => {
    if (!state.userTranslation.trim()) return;
    
    dispatch({ type: "START_EVALUATION" });
    evaluateTranslation.mutate({
      japaneseSentence: state.japaneseSentence,
      userTranslation: state.userTranslation,
      difficultyLevel: difficulty,
    });
  };

  const handleNextProblem = () => {
    console.log("🔄 NEXT BUTTON: Next problem clicked");
    
    if (state.dailyLimitReached) {
      console.log("🛑 NEXT BLOCKED: Daily limit reached");
      return;
    }
    
    if (isProcessingRef.current || isGeneratingRef.current) {
      console.log("🛑 NEXT BLOCKED: Still processing");
      return;
    }
    
    console.log("✅ NEXT APPROVED: Resetting and loading next problem");
    dispatch({ type: "RESET_FOR_NEXT" });
    generateProblem.reset();
    evaluateTranslation.reset();
    
    // Add small delay to ensure cleanup
    setTimeout(() => {
      loadNewProblem();
    }, 100);
  };

  const handleInputChange = (value: string) => {
    dispatch({ type: "USER_INPUT", input: value });
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
            <p className="text-sm text-gray-500">問題 #{state.problemCount}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Initial state - Manual start only */}
        {state.step === "loading" && isInitialized.current === false && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <h2 className="text-xl font-semibold mb-4">準備完了</h2>
            <p className="text-gray-600 mb-6 text-center">
              英作文の練習を始めましょう。<br/>
              下のボタンを押して最初の問題を表示します。
            </p>
            <Button 
              onClick={() => {
                isInitialized.current = true;
                loadNewProblem();
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3"
            >
              問題を表示する
            </Button>
          </div>
        )}

        {/* Loading state */}
        {state.step === "loading" && isInitialized.current === true && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">問題を読み込み中...</p>
            </div>
          </div>
        )}

        {/* Problem display */}
        {state.step === "show_problem" && (
          <div className="flex-1 flex flex-col p-6">
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-sm font-medium text-blue-800 mb-2">日本語</h3>
              <p className="text-lg text-blue-900 font-medium">{state.japaneseSentence}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                英訳を入力してください
              </label>
              <Textarea
                value={state.userTranslation}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="英語で翻訳を入力..."
                className="min-h-[120px] resize-none"
                disabled={state.step === "evaluating"}
              />
            </div>

            <Button
              onClick={handleSubmitTranslation}
              disabled={!state.userTranslation.trim() || state.step === "evaluating"}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3"
            >
              <Send className="h-4 w-4 mr-2" />
              回答を送信
            </Button>
          </div>
        )}

        {/* Evaluation loading */}
        {state.step === "evaluating" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">評価中...</p>
            </div>
          </div>
        )}

        {/* Results display */}
        {state.step === "show_result" && state.evaluation && (
          <div className="flex-1 flex flex-col p-6">
            <div className="bg-white rounded-lg border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">評価結果</h3>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= (state.evaluation?.rating || 0)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">模範解答</h4>
                  <p className="text-green-700 bg-green-50 p-3 rounded border-l-4 border-green-400">
                    {state.evaluation.modelAnswer}
                  </p>
                  <SpeechButton text={state.evaluation.modelAnswer} />
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">フィードバック</h4>
                  <p className="text-gray-700 leading-relaxed">{state.evaluation.feedback}</p>
                </div>
                
                {state.evaluation.similarPhrases && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">類似表現</h4>
                    <div className="space-y-2">
                      {state.evaluation.similarPhrases.map((phrase: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <p className="text-gray-600">{phrase}</p>
                          <SpeechButton text={phrase} />
                        </div>
                      ))}
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

        {/* Daily limit reached */}
        {state.step === "daily_limit" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-4">本日の学習完了</h2>
              <p className="text-gray-600 mb-6">
                本日の最大出題数（100問）に達しました。<br/>
                明日またお試しください。
              </p>
              <Button onClick={onBack} variant="outline">
                戻る
              </Button>
            </div>
          </div>
        )}

        {/* Error state */}
        {state.step === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-4">エラーが発生しました</h2>
              <p className="text-gray-600 mb-6">{state.error}</p>
              <div className="space-x-3">
                <Button onClick={loadNewProblem} variant="outline">
                  再試行
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