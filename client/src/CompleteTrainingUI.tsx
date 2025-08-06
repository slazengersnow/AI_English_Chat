import React, { useState } from "react";

type DifficultyLevel = "toeic" | "middle_school" | "high_school" | "basic_verbs" | "business_email" | "simulation";

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

// スクリーンショットの完全な英作文トレーニング画面を再現
export default function CompleteTrainingUI() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProblem = async (difficulty: DifficultyLevel) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching problem for difficulty:", difficulty);
      
      const response = await fetch("/api/problem", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ difficultyLevel: difficulty }),
      });
      
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const problem = await response.json();
      console.log("Problem received:", problem);
      setCurrentProblem(problem);
    } catch (error) {
      console.error("Fetch problem error:", error);
      setError(`問題の取得に失敗しました: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!currentProblem || !userAnswer.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          japaneseSentence: currentProblem.japaneseSentence,
          userTranslation: userAnswer,
          difficultyLevel: selectedDifficulty,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const evaluation = await response.json();
      setEvaluationResult(evaluation);
    } catch (error) {
      setError(`評価の取得に失敗しました: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDifficultySelect = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty);
    fetchProblem(difficulty);
  };

  const handleNextProblem = () => {
    setCurrentProblem(null);
    setUserAnswer("");
    setEvaluationResult(null);
    if (selectedDifficulty) {
      fetchProblem(selectedDifficulty);
    }
  };

  const handleBackToMenu = () => {
    setSelectedDifficulty(null);
    setCurrentProblem(null);
    setUserAnswer("");
    setEvaluationResult(null);
    setError(null);
  };

  // Practice screen
  if (selectedDifficulty && (currentProblem || isLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-800">英作文トレーニング</h1>
              <button 
                onClick={handleBackToMenu}
                className="text-gray-500 hover:text-gray-700"
              >
                ← メニューに戻る
              </button>
            </div>
          </div>

          {/* Problem Display */}
          {currentProblem && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">日本語文</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                {currentProblem.japaneseSentence}
              </p>
              
              <h3 className="text-md font-semibold text-gray-800 mb-2">英訳してください：</h3>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="英訳を入力してください..."
              />
              
              <button
                onClick={evaluateAnswer}
                disabled={isLoading || !userAnswer.trim()}
                className="mt-4 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {isLoading ? "評価中..." : "回答を送信"}
              </button>
            </div>
          )}

          {/* Evaluation Results */}
          {evaluation && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
              <div className="text-center mb-4">
                <span className="text-3xl font-bold text-blue-600">
                  {evaluation.rating}/5
                </span>
                <p className="text-gray-600">点</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">模範解答：</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {evaluation.modelAnswer}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">フィードバック：</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-line">
                    {evaluation.feedback}
                  </p>
                </div>
                
                {evaluation.similarPhrases && evaluation.similarPhrases.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">類似表現：</h4>
                    <ul className="bg-gray-50 p-3 rounded-lg space-y-1">
                      {evaluation.similarPhrases.map((phrase, index) => (
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
          {isLoading && !currentProblem && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">問題を生成中...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto pt-8 pb-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">英作文トレーニング</h1>
          <p className="text-gray-600 text-sm">AIが瞬時に添削・評価します</p>
        </div>
      </div>

      {/* Level Selection Cards */}
      <div className="max-w-md mx-auto space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 px-2">レベルを選択してください</h2>
        
        {/* TOEIC */}
        <div 
          onClick={() => handleDifficultySelect("toeic")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">TOEIC</h3>
              <p className="text-sm text-gray-600">ビジネス英語・資格対策</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>

        {/* 中学英語 */}
        <div 
          onClick={() => handleDifficultySelect("middle_school")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">中学英語</h3>
              <p className="text-sm text-gray-600">基本的な文法と語彙</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>

        {/* 高校英語 */}
        <div 
          onClick={() => handleDifficultySelect("high_school")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">高校英語</h3>
              <p className="text-sm text-gray-600">応用文法と表現</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>

        {/* 基本動詞 */}
        <div 
          onClick={() => handleDifficultySelect("basic_verbs")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">基本動詞</h3>
              <p className="text-sm text-gray-600">日常動詞の使い分け</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>

        {/* ビジネスメール */}
        <div 
          onClick={() => handleDifficultySelect("business_email")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">ビジネスメール</h3>
              <p className="text-sm text-gray-600">実務メール作成</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>

        {/* シミュレーション練習 */}
        <div 
          onClick={() => handleDifficultySelect("simulation")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">シミュレーション練習</h3>
              <p className="text-sm text-gray-600">実際の場面を想定した練習</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Premium Features Section */}
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold text-center mb-4">プレミアム機能</h3>
          <div className="space-y-2 text-sm mb-6">
            <div className="flex items-center gap-2">
              <span>•</span>
              <span>詳細な添削フィードバック</span>
            </div>
            <div className="flex items-center gap-2">
              <span>•</span>
              <span>進捗レポート機能</span>
            </div>
            <div className="flex items-center gap-2">
              <span>•</span>
              <span>無制限の練習問題</span>
            </div>
          </div>
          <button className="w-full bg-white text-purple-600 px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors">
            7日間無料です
          </button>
        </div>
      </div>
    </div>
  );
}