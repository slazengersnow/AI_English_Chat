import React, { useReducer, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Star, Sparkles, Bookmark, BookmarkCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { DIFFICULTY_LEVELS, type DifficultyKey } from "@/lib/constants";
import { SpeechButton } from "@/components/speech-button";

interface SimpleProblemPracticeProps {
  difficulty: DifficultyKey;
  onBack: () => void;
}

// State machine using useReducer to prevent infinite loops
type StateType = "initial" | "loading_problem" | "showing_problem" | "evaluating" | "showing_result" | "error";

interface AppState {
  currentState: StateType;
  problem: string;
  userAnswer: string;
  evaluation: any;
  error: string;
  isBookmarked: boolean;
}

type ActionType =
  | { type: "START_LOADING" }
  | { type: "PROBLEM_LOADED"; payload: string }
  | { type: "PROBLEM_ERROR"; payload: string }
  | { type: "SET_ANSWER"; payload: string }
  | { type: "START_EVALUATING" }
  | { type: "EVALUATION_COMPLETE"; payload: any }
  | { type: "EVALUATION_ERROR"; payload: string }
  | { type: "TOGGLE_BOOKMARK" }
  | { type: "RESET_FOR_NEW_PROBLEM" };

const initialState: AppState = {
  currentState: "initial",
  problem: "",
  userAnswer: "",
  evaluation: null,
  error: "",
  isBookmarked: false,
};

function appReducer(state: AppState, action: ActionType): AppState {
  switch (action.type) {
    case "START_LOADING":
      return {
        ...state,
        currentState: "loading_problem",
        error: "",
      };

    case "PROBLEM_LOADED":
      return {
        ...state,
        currentState: "showing_problem",
        problem: action.payload,
        error: "",
      };

    case "PROBLEM_ERROR":
      return {
        ...state,
        currentState: "error",
        error: action.payload,
      };

    case "SET_ANSWER":
      return {
        ...state,
        userAnswer: action.payload,
      };

    case "START_EVALUATING":
      return {
        ...state,
        currentState: "evaluating",
        error: "",
      };

    case "EVALUATION_COMPLETE":
      return {
        ...state,
        currentState: "showing_result",
        evaluation: action.payload,
      };

    case "EVALUATION_ERROR":
      return {
        ...state,
        currentState: "error",
        error: action.payload,
      };

    case "TOGGLE_BOOKMARK":
      return {
        ...state,
        isBookmarked: !state.isBookmarked,
      };

    case "RESET_FOR_NEW_PROBLEM":
      return {
        ...initialState,
        currentState: "initial",
      };

    default:
      return state;
  }
}

export function SimpleProblemPractice({ difficulty, onBack }: SimpleProblemPracticeProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const hasInitialized = useRef(false);

  // ONE-TIME initialization on mount - STRICT CONTROL
  useEffect(() => {
    let isMounted = true;

    const initializeOnce = async () => {
      // Absolute prevention of double execution
      if (hasInitialized.current) {
        console.log("Already initialized, blocking");
        return;
      }

      hasInitialized.current = true;
      console.log("🎯 SINGLE initialization for difficulty:", difficulty);

      dispatch({ type: "START_LOADING" });

      try {
        const response = await apiRequest("POST", "/api/problem", {
          difficultyLevel: difficulty,
        });

        if (!isMounted) return;

        const data = await response.json();
        console.log("✅ Single problem loaded:", data.japaneseSentence);

        dispatch({ type: "PROBLEM_LOADED", payload: data.japaneseSentence });
      } catch (err: any) {
        if (!isMounted) return;

        console.error("❌ Problem generation failed:", err);
        const errorMsg = err.message?.includes("429") || err.message?.includes("最大出題数")
          ? "本日の最大出題数（100問）に達しました。明日また学習を再開できます。"
          : "問題の生成に失敗しました。しばらく待ってから再試行してください。";

        dispatch({ type: "PROBLEM_ERROR", payload: errorMsg });
      }
    };

    initializeOnce();

    return () => {
      isMounted = false;
    };
  }, []); // EMPTY ARRAY - NO DEPENDENCIES

  const handleSubmitAnswer = async () => {
    if (!state.userAnswer.trim() || !state.problem) return;

    dispatch({ type: "START_EVALUATING" });

    try {
      const response = await apiRequest("POST", "/api/translate", {
        japaneseSentence: state.problem,
        userTranslation: state.userAnswer.trim(),
        difficultyLevel: difficulty,
      });
      const data = await response.json();

      dispatch({ type: "EVALUATION_COMPLETE", payload: data });
    } catch (err: any) {
      console.error("Evaluation failed:", err);
      dispatch({ type: "EVALUATION_ERROR", payload: "評価に失敗しました。しばらく待ってから再試行してください。" });
    }
  };

  const handleNewProblem = async () => {
    // Reset the initialization flag for new problem
    hasInitialized.current = false;
    dispatch({ type: "RESET_FOR_NEW_PROBLEM" });

    // Small delay to ensure clean state reset
    setTimeout(async () => {
      if (hasInitialized.current) return;

      hasInitialized.current = true;
      console.log("🔄 Generating NEW problem for:", difficulty);

      dispatch({ type: "START_LOADING" });

      try {
        const response = await apiRequest("POST", "/api/problem", {
          difficultyLevel: difficulty,
        });
        const data = await response.json();

        console.log("✅ New problem loaded:", data.japaneseSentence);
        dispatch({ type: "PROBLEM_LOADED", payload: data.japaneseSentence });
      } catch (err: any) {
        console.error("❌ New problem generation failed:", err);
        const errorMsg = err.message?.includes("429") || err.message?.includes("最大出題数")
          ? "本日の最大出題数（100問）に達しました。明日また学習を再開できます。"
          : "問題の生成に失敗しました。しばらく待ってから再試行してください。";

        dispatch({ type: "PROBLEM_ERROR", payload: errorMsg });
      }
    }, 100);
  };

  const handleToggleBookmark = async () => {
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
    if (e.key === "Enter" && !e.shiftKey && state.currentState === "showing_problem" && state.userAnswer.trim()) {
      e.preventDefault();
      handleSubmitAnswer();
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

          {/* Initial/Loading State */}
          {(state.currentState === "initial" || state.currentState === "loading_problem") && (
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
          {state.currentState === "error" && (
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
                onClick={handleNewProblem}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                再試行
              </Button>
            </div>
          )}

          {/* Problem Display */}
          {state.currentState === "showing_problem" && state.problem && (
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
                  onChange={(e) => dispatch({ type: "SET_ANSWER", payload: e.target.value })}
                  onKeyPress={handleKeyPress}
                  placeholder="英訳を入力してください..."
                  className="resize-none min-h-[80px] bg-white"
                />
              </div>
            </>
          )}

          {/* User Answer Display */}
          {state.currentState === "showing_result" && state.userAnswer && (
            <div className="bg-blue-600 text-white rounded-2xl px-4 py-3 ml-auto max-w-[85%]">
              <div className="text-sm sm:text-base leading-relaxed">
                {state.userAnswer}
              </div>
            </div>
          )}

          {/* Evaluation Display */}
          {state.currentState === "showing_result" && state.evaluation && (
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
                    onClick={handleToggleBookmark}
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
          {state.currentState === "evaluating" && (
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
          {state.currentState === "showing_problem" && (
            <Button
              onClick={handleSubmitAnswer}
              disabled={!state.userAnswer.trim() || state.currentState === "evaluating"}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl"
            >
              {state.currentState === "evaluating" ? "評価中..." : "回答を送信"}
              <Send className="w-5 h-5 ml-2" />
            </Button>
          )}
          
          {state.currentState === "showing_result" && (
            <Button
              onClick={handleNewProblem}
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