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

// Simple state machine - NO COMPLEX TRANSITIONS
type ProblemStep = 
  | "loading" 
  | "problem_ready" 
  | "input_ready" 
  | "evaluating" 
  | "result_ready"
  | "daily_limit"
  | "error";

interface ProblemState {
  step: ProblemStep;
  problem: string;
  userAnswer: string;
  evaluation: any;
  error: string;
  isBookmarked: boolean;
}

type ProblemAction =
  | { type: "START_LOADING" }
  | { type: "PROBLEM_LOADED"; problem: string }
  | { type: "SET_DAILY_LIMIT" }
  | { type: "SET_ERROR"; error: string }
  | { type: "SET_USER_INPUT"; input: string }
  | { type: "START_EVALUATION" }
  | { type: "EVALUATION_DONE"; evaluation: any }
  | { type: "TOGGLE_BOOKMARK" }
  | { type: "RESET_FOR_NEXT" };

const initialState: ProblemState = {
  step: "loading",
  problem: "",
  userAnswer: "",
  evaluation: null,
  error: "",
  isBookmarked: false,
};

function problemReducer(state: ProblemState, action: ProblemAction): ProblemState {
  switch (action.type) {
    case "START_LOADING":
      return { ...initialState, step: "loading" };
    
    case "PROBLEM_LOADED":
      return { 
        ...state, 
        step: "problem_ready", 
        problem: action.problem,
        error: ""
      };
    
    case "SET_DAILY_LIMIT":
      return { 
        ...state, 
        step: "daily_limit",
        error: "本日の最大出題数（100問）に達しました。明日また学習を再開できます。"
      };
    
    case "SET_ERROR":
      return { 
        ...state, 
        step: "error", 
        error: action.error 
      };
    
    case "SET_USER_INPUT":
      return { 
        ...state, 
        userAnswer: action.input,
        step: action.input.trim() ? "input_ready" : "problem_ready"
      };
    
    case "START_EVALUATION":
      return { ...state, step: "evaluating" };
    
    case "EVALUATION_DONE":
      return { 
        ...state, 
        step: "result_ready", 
        evaluation: action.evaluation 
      };
    
    case "TOGGLE_BOOKMARK":
      return { ...state, isBookmarked: !state.isBookmarked };
    
    case "RESET_FOR_NEXT":
      return { 
        ...initialState, 
        step: "loading" 
      };
    
    default:
      return state;
  }
}

export function ProblemPractice({ difficulty, onBack }: ProblemPracticeProps) {
  const [state, dispatch] = useReducer(problemReducer, initialState);
  const isInitialized = useRef(false);
  const abortController = useRef<AbortController | null>(null);

  // Problem generation mutation - NO RETRY
  const generateProblem = useApiMutation<any, { difficultyLevel: string }>(
    async ({ difficultyLevel }) => {
      console.log("🔄 generateProblem mutationFn called with:", difficultyLevel);
      
      // Abort any previous request
      if (abortController.current) {
        console.log("⚠️ Aborting previous request");
        abortController.current.abort();
      }
      
      abortController.current = new AbortController();
      
      const response = await fetch("/api/problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficultyLevel }),
        signal: abortController.current.signal,
      });

      console.log("📡 API Response status:", response.status);

      if (response.status === 429) {
        console.warn("🛑 DAILY LIMIT 429 detected - checking response data");
        const data = await response.json();
        console.log("📋 429 Response data:", data);
        
        if (data.dailyLimitReached) {
          console.error("🚨 DAILY LIMIT REACHED - stopping further generation");
          throw new Error("DAILY_LIMIT");
        }
      }

      if (!response.ok) {
        console.error("❌ Response not OK:", response.status, await response.text());
        throw new Error(`${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log("✅ Problem data received:", data);
      
      // Double check for daily limit
      if (data.dailyLimitReached) {
        console.error("🚨 DAILY LIMIT in response data - stopping");
        throw new Error("DAILY_LIMIT");
      }

      return data;
    }
  );

  // Translation evaluation mutation - NO RETRY  
  const evaluateTranslation = useApiMutation<any, { 
    japaneseSentence: string; 
    userTranslation: string; 
    difficultyLevel: string; 
  }>(
    async ({ japaneseSentence, userTranslation, difficultyLevel }) => {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          japaneseSentence,
          userTranslation,
          difficultyLevel,
        }),
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }

      return await response.json();
    }
  );

  // Initial problem load - ONLY ONCE
  useEffect(() => {
    console.log("🚀 useEffect initial load triggered");
    console.log("🔍 isInitialized.current:", isInitialized.current);
    
    if (isInitialized.current) {
      console.log("⏭️ Already initialized - skipping");
      return;
    }
    
    console.log("✨ First time initialization");
    isInitialized.current = true;

    console.log("📤 Dispatching START_LOADING");
    dispatch({ type: "START_LOADING" });
    
    console.log("🎯 Calling generateProblem.mutate with difficulty:", difficulty);
    generateProblem.mutate({ difficultyLevel: difficulty });
  }, []); // EMPTY DEPENDENCY ARRAY

  // Handle problem generation result
  useEffect(() => {
    console.log("🔄 useEffect: problem generation result check");
    console.log("📊 generateProblem.isSuccess:", generateProblem.isSuccess);
    console.log("📊 generateProblem.data:", generateProblem.data);
    
    if (generateProblem.isSuccess && generateProblem.data) {
      console.log("✅ Problem loaded successfully, dispatching PROBLEM_LOADED");
      dispatch({ 
        type: "PROBLEM_LOADED", 
        problem: generateProblem.data.japaneseSentence 
      });
    }
  }, [generateProblem.isSuccess, generateProblem.data]);

  // Handle problem generation error
  useEffect(() => {
    console.log("🔄 useEffect: problem generation error check");
    console.log("📊 generateProblem.isError:", generateProblem.isError);
    console.log("📊 generateProblem.error:", generateProblem.error);
    
    if (generateProblem.isError) {
      const error = generateProblem.error as Error;
      console.log("❌ Error message:", error.message);
      
      if (error.message === "DAILY_LIMIT") {
        console.log("🛑 Setting daily limit state");
        dispatch({ type: "SET_DAILY_LIMIT" });
      } else {
        console.log("⚠️ Setting general error state");
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
        type: "EVALUATION_DONE", 
        evaluation: evaluateTranslation.data 
      });
    }
  }, [evaluateTranslation.isSuccess, evaluateTranslation.data]);

  // Handle evaluation error
  useEffect(() => {
    if (evaluateTranslation.isError) {
      dispatch({ 
        type: "SET_ERROR", 
        error: "翻訳の評価に失敗しました。" 
      });
    }
  }, [evaluateTranslation.isError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const handleInputChange = (value: string) => {
    dispatch({ type: "SET_USER_INPUT", input: value });
  };

  const handleSubmit = () => {
    if (state.step !== "input_ready" || !state.userAnswer.trim()) return;
    
    dispatch({ type: "START_EVALUATION" });
    evaluateTranslation.mutate({
      japaneseSentence: state.problem,
      userTranslation: state.userAnswer.trim(),
      difficultyLevel: difficulty,
    });
  };

  const handleNextProblem = () => {
    console.log("🔄 handleNextProblem called manually by user");
    // Reset everything and get new problem
    console.log("🔄 Dispatching RESET_FOR_NEXT");
    dispatch({ type: "RESET_FOR_NEXT" });
    
    console.log("🔄 Resetting mutations");
    generateProblem.reset();
    evaluateTranslation.reset();
    
    console.log("🔄 Manually triggering new problem generation");
    generateProblem.mutate({ difficultyLevel: difficulty });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && state.step === "input_ready") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const isLoading = state.step === "loading" || generateProblem.isPending;
  const isEvaluating = state.step === "evaluating" || evaluateTranslation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h3 className="font-semibold text-gray-900">
                {DIFFICULTY_LEVELS[difficulty]}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="text-gray-500">問題を読み込み中...</div>
            </div>
          )}

          {/* Problem Display */}
          {(state.step === "problem_ready" || state.step === "input_ready") && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-gray-700 text-lg mb-4 leading-relaxed">
                {state.problem}
              </div>
              <div className="flex items-center justify-end">
                <SpeechButton text={state.problem} />
              </div>
            </div>
          )}

          {/* Input Area */}
          {(state.step === "problem_ready" || state.step === "input_ready") && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Textarea
                value={state.userAnswer}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="英語で翻訳してください..."
                className="min-h-[100px] mb-4"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmit}
                  disabled={state.step !== "input_ready"}
                  className="flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>送信</span>
                </Button>
              </div>
            </div>
          )}

          {/* Evaluating State */}
          {isEvaluating && (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="text-gray-500">翻訳を評価中...</div>
            </div>
          )}

          {/* Result Display */}
          {state.step === "result_ready" && state.evaluation && (
            <div className="space-y-4">
              {/* Rating */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {renderStars(state.evaluation.rating)}
                    <span className="font-semibold text-lg">
                      {state.evaluation.rating}/5
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch({ type: "TOGGLE_BOOKMARK" })}
                  >
                    {state.isBookmarked ? (
                      <BookmarkCheck className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      模範回答
                    </h4>
                    <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                      <div className="flex items-center justify-between">
                        <span className="text-green-800">
                          {state.evaluation.correctTranslation}
                        </span>
                        <SpeechButton 
                          text={state.evaluation.correctTranslation} 
                          size="sm" 
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      フィードバック
                    </h4>
                    <p className="text-gray-700">
                      {state.evaluation.feedback}
                    </p>
                  </div>

                  {state.evaluation.explanation && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        詳細解説
                      </h4>
                      <p className="text-gray-700">
                        {state.evaluation.explanation}
                      </p>
                    </div>
                  )}

                  {state.evaluation.similarPhrases?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        類似フレーズ
                      </h4>
                      <div className="space-y-2">
                        {state.evaluation.similarPhrases.map((phrase: string, index: number) => (
                          <div key={index} className="bg-blue-50 p-3 rounded">
                            <div className="flex items-center justify-between">
                              <span className="text-blue-800">{phrase}</span>
                              <SpeechButton text={phrase} size="sm" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Problem Button */}
              <div className="flex justify-center">
                <Button onClick={handleNextProblem} size="lg">
                  次の問題
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {(state.step === "error" || state.step === "daily_limit") && (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="text-red-600 mb-4">{state.error}</div>
              {state.step === "error" && (
                <Button onClick={() => {
                  dispatch({ type: "RESET_FOR_NEXT" });
                  generateProblem.mutate({ difficultyLevel: difficulty });
                }}>
                  再試行
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}