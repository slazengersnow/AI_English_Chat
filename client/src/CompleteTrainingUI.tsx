import React, { useState, useEffect } from "react";
// Removed mock data import - using only real API data
import { claudeApiRequest } from "./lib/queryClient";
import ChatStyleTraining from "./ChatStyleTraining";
import AdminDashboard from "./AdminDashboard";
import MyPage from "./pages/my-page";
import { SimpleAuth } from "./SimpleAuth";

type DifficultyLevel = "toeic" | "middle_school" | "high_school" | "basic_verbs" | "business_email";

interface Problem {
  japaneseSentence: string;
  hints: string[];
  modelAnswer: string;
  difficulty: string;
}

interface EvaluationResult {
  rating: number;
  modelAnswer: string;
  feedback: string;
  similarPhrases: string[];
}

interface UserInfo {
  email: string;
}

interface CompleteTrainingUIProps {
  user: UserInfo;
  onLogout: () => void;
}

// スクリーンショットの完全な英作文画面を再現
export default function CompleteTrainingUI({ user, onLogout }: CompleteTrainingUIProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [currentPage, setCurrentPage] = useState<'menu' | 'training' | 'admin' | 'mypage' | 'login'>(() => {
    // Load saved page from localStorage on initial load
    const savedPage = localStorage.getItem('englishTrainingCurrentPage');
    return (savedPage as 'menu' | 'training' | 'admin' | 'mypage' | 'login') || 'menu';
  });
  const [showAuth, setShowAuth] = useState(true);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProblem = async (difficulty: DifficultyLevel) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Generating problem for difficulty:", difficulty);
      
      // Try Claude API first, fallback to mock data
      const response = await claudeApiRequest("/api/problem", {
        difficultyLevel: difficulty,
        sessionId: `training_${Date.now()}`
      });
      
      if (response) {
        setCurrentProblem({
          japaneseSentence: response.japaneseSentence,
          hints: response.hints || [],
          modelAnswer: response.modelAnswer,
          difficulty: response.difficulty || difficulty
        });
        setSelectedDifficulty(difficulty);
        console.log("Claude API problem generated successfully");
      } else {
        throw new Error("問題の生成に失敗しました");
      }
      
    } catch (error) {
      console.error("Problem generation error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`問題の生成に失敗しました: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentProblem || !userAnswer.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      console.log("Evaluating answer with Claude API");
      
      // Try Claude API evaluation first, fallback to mock
      const evaluationResponse = await claudeApiRequest("/api/evaluate-with-claude", {
        userAnswer: userAnswer.trim(),
        japaneseSentence: currentProblem.japaneseSentence,
        modelAnswer: currentProblem.modelAnswer,
        difficulty: currentProblem.difficulty
      });
      
      console.log("Claude evaluation response:", evaluationResponse);
      
      if (evaluationResponse) {
        setEvaluationResult({
          rating: evaluationResponse.rating,
          modelAnswer: currentProblem.modelAnswer, // Use the original model answer
          feedback: evaluationResponse.feedback,
          similarPhrases: evaluationResponse.similarPhrases || []
        });
        console.log("Claude API evaluation completed successfully");
      } else {
        throw new Error("評価の取得に失敗しました");
      }
      
    } catch (error) {
      console.error("Evaluation error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`評価の取得に失敗しました: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDifficultySelect = async (difficulty: DifficultyLevel) => {
    console.log("Difficulty selected:", difficulty);
    setSelectedDifficulty(difficulty);
    setCurrentPage('training');
    // Save the page state immediately
    localStorage.setItem('englishTrainingCurrentPage', 'training');
    // Don't call fetchProblem here - let ChatStyleTraining handle it
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
    setCurrentPage('menu');
    setSelectedDifficulty(null);
    setCurrentProblem(null);
    setUserAnswer("");
    setEvaluationResult(null);
    setError(null);
    localStorage.setItem('englishTrainingCurrentPage', 'menu');
  };

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('englishTrainingCurrentPage', currentPage);
  }, [currentPage]);

  // Auth overlay
  if (showAuth) {
    return (
      <SimpleAuth onClose={() => setShowAuth(false)} />
    );
  }

  // Admin Dashboard
  if (currentPage === 'admin') {
    return <AdminDashboard onBackToMenu={handleBackToMenu} />;
  }

  // My Page
  if (currentPage === 'mypage') {
    return <MyPage 
      onBackToMenu={handleBackToMenu} 
      onStartTraining={(problem) => {
        // Create a mock problem with the bookmarked sentence
        setCurrentProblem({
          japaneseSentence: problem,
          hints: [],
          modelAnswer: "Please translate this sentence.",
          difficulty: "toeic"
        });
        setSelectedDifficulty("toeic");
        setCurrentPage('training');
      }}
      onShowAuth={() => setShowAuth(true)}
    />;
  }

  // Chat-style practice screen
  if (currentPage === 'training' && selectedDifficulty) {
    console.log("Rendering ChatStyleTraining with difficulty:", selectedDifficulty);
    return (
      <ChatStyleTraining 
        difficulty={selectedDifficulty} 
        onBackToMenu={handleBackToMenu}
        onGoToMyPage={() => setCurrentPage('mypage')}
        initialProblem={undefined}  // Let ChatStyleTraining generate its own problems
        isBookmarkMode={false}      // Start in normal mode, not bookmark mode
      />
    );
  }

  // Legacy practice screen (fallback)
  if (false && selectedDifficulty && (currentProblem || isLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          {/* Header - Mobile Optimized */}
          <div className="bg-white rounded-lg shadow-lg mb-4">
            <div className="flex items-center justify-between p-3 md:p-4">
              <button 
                onClick={handleBackToMenu}
                className="flex flex-col items-center justify-center min-w-[60px] p-2 text-gray-600 hover:text-gray-800"
              >
                <span className="text-lg">←</span>
                <span className="text-[10px] leading-tight">メニュー</span>
              </button>
              <h1 className="text-sm md:text-lg font-bold text-gray-800 flex items-center gap-2">
                ✏️<span className="hidden sm:inline">英作文トレーニング</span><span className="sm:hidden">英作文</span>
              </h1>
              <button 
                onClick={() => window.location.href = "/my-page"}
                className="flex flex-col items-center justify-center min-w-[60px] p-2 text-gray-600 hover:text-gray-800"
              >
                <span className="text-lg">👤</span>
                <span className="text-[10px] leading-tight">マイページ</span>
              </button>
            </div>
          </div>

          {/* Problem Display */}
          {currentProblem && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">日本語文</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                {currentProblem?.japaneseSentence}
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
                onClick={submitAnswer}
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
                  {evaluation?.rating || 0}/5
                </span>
                <p className="text-gray-600">点</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">模範解答：</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {evaluation?.modelAnswer || ''}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">フィードバック：</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-line">
                    {evaluation?.feedback || ''}
                  </p>
                </div>
                
                {evaluation?.similarPhrases && evaluation.similarPhrases.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">類似表現：</h4>
                    <ul className="bg-gray-50 p-3 rounded-lg space-y-1">
                      {evaluation?.similarPhrases?.map((phrase, index) => (
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
    <div className="min-h-screen p-4" style={{ backgroundColor: '#e7effe' }}>
      {/* Header with buttons - positioned absolutely to screen edge */}
      <div className="absolute top-4 right-4 flex space-x-2 z-10">
        <button 
          onClick={() => {
            setCurrentPage('admin');
            localStorage.setItem('englishTrainingCurrentPage', 'admin');
          }}
          className="px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-1 text-sm"
        >
          <span>🛡️</span>
          <span>管理者</span>
        </button>
        <button 
          onClick={() => {
            setCurrentPage('mypage');
            localStorage.setItem('englishTrainingCurrentPage', 'mypage');
          }}
          className="px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-1 text-sm"
        >
          <span>👤</span>
          <span>マイページ</span>
        </button>
      </div>

      <div className="max-w-md mx-auto pt-16">

        {/* Main Content */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI瞬間英作文チャット</h1>
          <p className="text-gray-600 text-sm">AIが瞬時に添削・評価します</p>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">レベルを選択してください</h2>
        
        <div className="space-y-3 mb-6">
          {/* TOEIC */}
          <div 
            onClick={() => handleDifficultySelect("toeic")}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">TOEIC</h3>
                <p className="text-sm text-gray-600">ビジネス英語・資格対策</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>

          {/* 中学英語 */}
          <div 
            onClick={() => handleDifficultySelect("middle_school")}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">中学英語</h3>
                <p className="text-sm text-gray-600">基本的な文法と語彙</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>

          {/* 高校英語 */}
          <div 
            onClick={() => handleDifficultySelect("high_school")}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">高校英語</h3>
                <p className="text-sm text-gray-600">応用文法と表現</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>

          {/* 基本動詞 */}
          <div 
            onClick={() => handleDifficultySelect("basic_verbs")}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">基本動詞</h3>
                <p className="text-sm text-gray-600">日常動詞の使い分け</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>

          {/* ビジネスメール */}
          <div 
            onClick={() => handleDifficultySelect("business_email")}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">ビジネスメール</h3>
                <p className="text-sm text-gray-600">実務メール作成</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>

        </div>

        {/* Premium CTA */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-5 text-white text-center">
          <h3 className="text-lg font-bold mb-3">最短で英語力アップ</h3>
          <ul className="text-xs space-y-1 mb-4">
            <li>• ネイティブ水準の添削フィードバック</li>
            <li>• あなた専用の進捗レポートで実力が見える</li>
            <li>• 中学生英語レベル〜TOEIC対策まで対応</li>
          </ul>
          <button className="bg-white text-blue-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm">
            今すぐ本登録する
          </button>
        </div>
      </div>
    </div>
  );
}