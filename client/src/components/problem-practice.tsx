import React, { useReducer, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Star, Sparkles, Bookmark, BookmarkCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { DIFFICULTY_LEVELS, type DifficultyKey } from "@/lib/constants";
import { SpeechButton } from "@/components/speech-button";

interface ProblemPracticeProps {
  difficulty: DifficultyKey;
  onBack: () => void;
}

// Explicit state machine to prevent loops
type AppStep = 
  | "loading"
  | "show_problem" 
  | "waiting_user_input"
  | "evaluating"
  | "show_result"
  | "wait_for_next_button"
  | "error";

interface ProblemState {
  step: AppStep;
  problem: string;
  userAnswer: string;
  evaluation: any;
  error: string;
  isBookmarked: boolean;
}

type ProblemAction =
  | { type: "LOAD_PROBLEM_START" }
  | { type: "LOAD_PROBLEM_SUCCESS"; problem: string }
  | { type: "LOAD_PROBLEM_ERROR"; error: string }
  | { type: "SET_USER_ANSWER"; answer: string }
  | { type: "EVALUATE_START" }
  | { type: "EVALUATE_SUCCESS"; evaluation: any }
  | { type: "EVALUATE_ERROR"; error: string }
  | { type: "TOGGLE_BOOKMARK" }
  | { type: "PREPARE_NEXT_PROBLEM" };

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
    case "LOAD_PROBLEM_START":
      return {
        ...initialState,
        step: "loading",
      };

    case "LOAD_PROBLEM_SUCCESS":
      return {
        ...state,
        step: "show_problem",
        problem: action.problem,
        error: "",
      };

    case "LOAD_PROBLEM_ERROR":
      return {
        ...state,
        step: "error",
        error: action.error,
      };

    case "SET_USER_ANSWER":
      return {
        ...state,
        userAnswer: action.answer,
        step: state.step === "show_problem" ? "waiting_user_input" : state.step,
      };

    case "EVALUATE_START":
      return {
        ...state,
        step: "evaluating",
        error: "",
      };

    case "EVALUATE_SUCCESS":
      return {
        ...state,
        step: "show_result",
        evaluation: action.evaluation,
      };

    case "EVALUATE_ERROR":
      return {
        ...state,
        step: "error",
        error: action.error,
      };

    case "TOGGLE_BOOKMARK":
      return {
        ...state,
        isBookmarked: !state.isBookmarked,
      };

    case "PREPARE_NEXT_PROBLEM":
      return {
        ...initialState,
        step: "loading",
      };

    default:
      return state;
  }
}

export function ProblemPractice({ difficulty, onBack }: ProblemPracticeProps) {
  const [state, dispatch] = useReducer(problemReducer, initialState);
  const initializationLock = useRef(false);

  // SINGLE initialization - strict control
  useEffect(() => {
    let mounted = true;

    async function loadInitialProblem() {
      // Absolute lock to prevent double execution
      if (initializationLock.current) {
        console.log("🔒 Initialization locked, skipping");
        return;
      }

      initializationLock.current = true;
      console.log("🎯 Loading SINGLE initial problem for:", difficulty);

      dispatch({ type: "LOAD_PROBLEM_START" });

      try {
        const response = await apiRequest("POST", "/api/problem", {
          difficultyLevel: difficulty,
        });

        if (!mounted) return;

        const data = await response.json();
        console.log("✅ Initial problem loaded:", data.japaneseSentence);

        dispatch({ 
          type: "LOAD_PROBLEM_SUCCESS", 
          problem: data.japaneseSentence 
        });
      } catch (err: any) {
        if (!mounted) return;

        console.error("❌ Initial problem load failed:", err);
        const errorMessage = err.message?.includes("429") || err.message?.includes("最大出題数")
          ? "本日の最大出題数（100問）に達しました。明日また学習を再開できます。"
          : "問題の生成に失敗しました。しばらく待ってから再試行してください。";

        dispatch({ 
          type: "LOAD_PROBLEM_ERROR", 
          error: errorMessage 
        });
      }
    }

    loadInitialProblem();

    return () => {
      mounted = false;
    };
  }, []); // CRITICAL: Empty dependency array

  const generateNextProblem = async () => {
    console.log("🔄 User requested next problem");
    
    // Reset lock for new problem
    initializationLock.current = false;
    dispatch({ type: "PREPARE_NEXT_PROBLEM" });

    // Delay to ensure clean state reset
    setTimeout(async () => {
      if (initializationLock.current) return;
      
      initializationLock.current = true;
      dispatch({ type: "LOAD_PROBLEM_START" });

      try {
        const response = await apiRequest("POST", "/api/problem", {
          difficultyLevel: difficulty,
        });
        const data = await response.json();

        console.log("✅ Next problem loaded:", data.japaneseSentence);
        dispatch({ 
          type: "LOAD_PROBLEM_SUCCESS", 
          problem: data.japaneseSentence 
        });
      } catch (err: any) {
        console.error("❌ Next problem load failed:", err);
        const errorMessage = err.message?.includes("429") || err.message?.includes("最大出題数")
          ? "本日の最大出題数（100問）に達しました。明日また学習を再開できます。"
          : "問題の生成に失敗しました。しばらく待ってから再試行してください。";

        dispatch({ 
          type: "LOAD_PROBLEM_ERROR", 
          error: errorMessage 
        });
      }
    }, 150);
  };

  const submitAnswer = async () => {
    if (!state.userAnswer.trim() || !state.problem) return;

    console.log("📝 Submitting answer");
    dispatch({ type: "EVALUATE_START" });

    try {
      const response = await apiRequest("POST", "/api/translate", {
        japaneseSentence: state.problem,
        userTranslation: state.userAnswer.trim(),
        difficultyLevel: difficulty,
      });
      const data = await response.json();

      console.log("✅ Evaluation completed");
      dispatch({ 
        type: "EVALUATE_SUCCESS", 
        evaluation: data 
      });
    } catch (err: any) {
      console.error("❌ Evaluation failed:", err);
      dispatch({ 
        type: "EVALUATE_ERROR", 
        error: "評価に失敗しました。しばらく待ってから再試行してください。" 
      });
    }
  };

  const toggleBookmark = async () => {
    if (!state.evaluation?.sessionId) return;

    try {
      await apiRequest("POST", `/api/sessions/${state.evaluation.sessionId}/bookmark`, {
        isBookmarked: !state.isBookmarked,
      });
      dispatch({ type: "TOGGLE_BOOKMARK" });
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && state.step === "waiting_user_input" && state.userAnswer.trim()) {
      e.preventDefault();
      submitAnswer();
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={onBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900 text-sm sm:text-base">
                {DIFFICULTY_LEVELS[difficulty]?.name || difficulty}
              </span>
            </div>
          </div>
          <div className="text-center">
            <span className="text-xs sm:text-sm text-gray-600 font-medium">
              1問練習
            </span>
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* Error Message */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <p className="text-red-800 text-sm">{state.error}</p>
            </div>
          )}

          {/* Loading State */}
          {state.step === "loading" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {DIFFICULTY_LEVELS[difficulty]?.name || difficulty} - 1問練習
              </h2>
              <p className="text-gray-600">
                問題を生成中...
              </p>
            </div>
          )}

          {/* Error State */}
          {state.step === "error" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                エラーが発生しました
              </h2>
              <p className="text-gray-600 mb-6">
                {state.error}
              </p>
              <Button
                onClick={generateNextProblem}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                再試行
              </Button>
            </div>
          )}

          {/* Problem Display */}
          {(state.step === "show_problem" || state.step === "waiting_user_input") && state.problem && (
            <>
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    問題
                  </span>
                  <SpeechButton
                    text={state.problem}
                    className="text-gray-400 hover:text-gray-600"
                  />
                </div>
                <div className="text-sm sm:text-base leading-relaxed text-gray-900">
                  {state.problem}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
                <p className="text-xs font-medium text-blue-700 mb-2">
                  上記の日本語を英語に翻訳してください:
                </p>
                <Textarea
                  value={state.userAnswer}
                  onChange={(e) => dispatch({ type: "SET_USER_ANSWER", answer: e.target.value })}
                  onKeyPress={handleKeyPress}
                  placeholder="英訳を入力してください..."
                  className="resize-none min-h-[80px] bg-white"
                />
              </div>
            </>
          )}

          {/* User Answer Display */}
          {state.step === "show_result" && state.userAnswer && (
            <div className="bg-blue-600 text-white rounded-2xl px-4 py-3 ml-auto max-w-[85%]">
              <div className="text-sm sm:text-base leading-relaxed">
                {state.userAnswer}
              </div>
            </div>
          )}

          {/* Evaluation Display */}
          {state.step === "show_result" && state.evaluation && (
            <div className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-3">
              <div className="space-y-3">
                {/* Rating */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-600">評価:</span>
                  <div className="flex space-x-1">{renderStars(state.evaluation.rating || 0)}</div>
                  <span className="text-xs text-gray-600">({state.evaluation.rating || 0}/5)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 hover:bg-gray-200 ml-auto"
                    onClick={toggleBookmark}
                  >
                    {state.isBookmarked ? (
                      <BookmarkCheck className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Bookmark className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>

                {/* Feedback */}
                {state.evaluation.feedback && (
                  <div className="text-sm text-gray-800">
                    {state.evaluation.feedback}
                  </div>
                )}

                {/* Correct Translation */}
                {state.evaluation.correctTranslation && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-xs font-medium text-green-700 mb-1 block">
                          模範解答:
                        </span>
                        <p className="text-sm text-green-800">
                          {state.evaluation.correctTranslation}
                        </p>
                      </div>
                      <SpeechButton
                        text={state.evaluation.correctTranslation}
                        className="text-green-600 hover:text-green-700 ml-2"
                        lang="en-US"
                        rate={0.8}
                      />
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {state.evaluation.explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <span className="text-xs font-medium text-blue-700 mb-1 block">
                      解説:
                    </span>
                    <p className="text-sm text-blue-800">{state.evaluation.explanation}</p>
                  </div>
                )}

                {/* Similar Phrases */}
                {state.evaluation.similarPhrases && state.evaluation.similarPhrases.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <span className="text-xs font-medium text-purple-700 mb-2 block">
                      類似表現:
                    </span>
                    <div className="space-y-1">
                      {state.evaluation.similarPhrases.map((phrase: string, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <p className="text-sm text-purple-800">{phrase}</p>
                          <SpeechButton
                            text={phrase}
                            className="text-purple-600 hover:text-purple-700 ml-2"
                            lang="en-US"
                            rate={0.8}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {state.evaluation.improvements && state.evaluation.improvements.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <span className="text-xs font-medium text-orange-700 mb-2 block">
                      改善点:
                    </span>
                    <div className="space-y-1">
                      {state.evaluation.improvements.map((improvement: string, idx: number) => (
                        <p key={idx} className="text-sm text-orange-800">
                          • {improvement}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evaluating State */}
          {state.step === "evaluating" && (
            <div className="flex justify-center">
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3">
                <div className="text-sm text-gray-600">
                  評価中...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Area */}
      <div className="bg-white border-t border-gray-200 px-2 sm:px-4 py-3">
        <div className="max-w-2xl mx-auto">
          {(state.step === "waiting_user_input" || (state.step === "show_problem" && state.userAnswer.trim())) && (
            <Button
              onClick={submitAnswer}
              disabled={!state.userAnswer.trim() || state.step === "evaluating"}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl"
            >
              {state.step === "evaluating" ? "評価中..." : "回答を送信"}
              <Send className="w-5 h-5 ml-2" />
            </Button>
          )}
          
          {state.step === "show_result" && (
            <Button
              onClick={generateNextProblem}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl"
            >
              新しい問題に挑戦
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}