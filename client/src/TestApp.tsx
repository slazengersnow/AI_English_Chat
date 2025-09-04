import React, { useState, useReducer } from "react";

type DifficultyLevel = "toeic" | "middle_school" | "high_school" | "basic_verbs";

interface Problem {
  japaneseSentence: string;
  hints: string[];
}

interface EvaluationResult {
  rating: number;
  modelAnswer: string;
  feedback: string;
  similarPhrases: string[];
}

type AppState = {
  view: "menu" | "practice";
  selectedDifficulty: DifficultyLevel | null;
  currentProblem: Problem | null;
  userAnswer: string;
  evaluation: EvaluationResult | null;
  isLoading: boolean;
  error: string | null;
};

type AppAction = 
  | { type: "SELECT_DIFFICULTY"; difficulty: DifficultyLevel }
  | { type: "SET_PROBLEM"; problem: Problem }
  | { type: "SET_USER_ANSWER"; answer: string }
  | { type: "SET_EVALUATION"; evaluation: EvaluationResult }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string }
  | { type: "RESET_TO_MENU" }
  | { type: "NEXT_PROBLEM" };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SELECT_DIFFICULTY":
      return { ...state, view: "practice", selectedDifficulty: action.difficulty, error: null };
    case "SET_PROBLEM":
      return { ...state, currentProblem: action.problem, userAnswer: "", evaluation: null };
    case "SET_USER_ANSWER":
      return { ...state, userAnswer: action.answer };
    case "SET_EVALUATION":
      return { ...state, evaluation: action.evaluation };
    case "SET_LOADING":
      return { ...state, isLoading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error, isLoading: false };
    case "RESET_TO_MENU":
      return { 
        view: "menu", 
        selectedDifficulty: null, 
        currentProblem: null, 
        userAnswer: "", 
        evaluation: null, 
        isLoading: false, 
        error: null 
      };
    case "NEXT_PROBLEM":
      return { ...state, currentProblem: null, userAnswer: "", evaluation: null };
    default:
      return state;
  }
}

const initialState: AppState = {
  view: "menu",
  selectedDifficulty: null,
  currentProblem: null,
  userAnswer: "",
  evaluation: null,
  isLoading: false,
  error: null,
};

export default function TestApp() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const fetchProblem = async (difficulty: DifficultyLevel) => {
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const response = await fetch("/api/problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficultyLevel: difficulty }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const problem = await response.json();
      dispatch({ type: "SET_PROBLEM", problem });
    } catch (error) {
      dispatch({ type: "SET_ERROR", error: `問題の取得に失敗しました: ${error}` });
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  };

  const evaluateAnswer = async () => {
    if (!state.currentProblem || !state.userAnswer.trim()) return;
    
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          japaneseSentence: state.currentProblem.japaneseSentence,
          userTranslation: state.userAnswer,
          difficultyLevel: state.selectedDifficulty,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const evaluation = await response.json();
      dispatch({ type: "SET_EVALUATION", evaluation });
    } catch (error) {
      dispatch({ type: "SET_ERROR", error: `評価の取得に失敗しました: ${error}` });
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  };

  const handleDifficultySelect = (difficulty: DifficultyLevel) => {
    dispatch({ type: "SELECT_DIFFICULTY", difficulty });
    fetchProblem(difficulty);
  };

  const handleNextProblem = () => {
    dispatch({ type: "NEXT_PROBLEM" });
    if (state.selectedDifficulty) {
      fetchProblem(state.selectedDifficulty);
    }
  };

  if (state.view === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🚀 AI瞬間英作文チャット
          </h1>
          <p className="text-gray-600 mb-6">メインアプリケーションテスト中</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => handleDifficultySelect("toeic")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              1問練習
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleDifficultySelect("toeic")}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                TOEIC
              </button>
              <button 
                onClick={() => handleDifficultySelect("middle_school")}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                中学校
              </button>
              <button 
                onClick={() => handleDifficultySelect("high_school")}
                className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                高校
              </button>
              <button 
                onClick={() => handleDifficultySelect("basic_verbs")}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                基本動詞
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">AI瞬間英作文チャット</h1>
            <button 
              onClick={() => dispatch({ type: "RESET_TO_MENU" })}
              className="text-gray-500 hover:text-gray-700"
            >
              ← メニューに戻る
            </button>
          </div>
        </div>

        {/* Problem Display */}
        {state.currentProblem && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">日本語文</h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              {state.currentProblem.japaneseSentence}
            </p>
            
            <h3 className="text-md font-semibold text-gray-800 mb-2">英訳してください：</h3>
            <textarea
              value={state.userAnswer}
              onChange={(e) => dispatch({ type: "SET_USER_ANSWER", answer: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="英訳を入力してください..."
            />
            
            <button
              onClick={evaluateAnswer}
              disabled={state.isLoading || !state.userAnswer.trim()}
              className="mt-4 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {state.isLoading ? "評価中..." : "回答を送信"}
            </button>
          </div>
        )}

        {/* Evaluation Results */}
        {state.evaluation && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <div className="text-center mb-4">
              <span className="text-3xl font-bold text-blue-600">
                {state.evaluation.rating}/5
              </span>
              <p className="text-gray-600">点</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">模範解答：</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {state.evaluation.modelAnswer}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">フィードバック：</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-line">
                  {state.evaluation.feedback}
                </p>
              </div>
              
              {state.evaluation.similarPhrases && state.evaluation.similarPhrases.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">類似表現：</h4>
                  <ul className="bg-gray-50 p-3 rounded-lg space-y-1">
                    {state.evaluation.similarPhrases.map((phrase, index) => (
                      <li key={index} className="text-gray-700">• {phrase}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <button
              onClick={handleNextProblem}
              className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              次の問題
            </button>
          </div>
        )}

        {/* Loading */}
        {state.isLoading && !state.currentProblem && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">問題を生成中...</p>
          </div>
        )}

        {/* Error */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{state.error}</p>
            <button
              onClick={() => dispatch({ type: "SET_ERROR", error: null })}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              エラーを閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}