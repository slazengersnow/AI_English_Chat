import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Direct implementation to avoid component loading issues
function DirectLoginApp() {
  const [user, setUser] = useState<{ email: string } | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          {/* AI アイコン */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">AI</span>
            </div>
          </div>

          {/* タイトル */}
          <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">
            AI瞬間英作文チャット
          </h1>
          <p className="text-center text-gray-500 mb-8">
            アカウントにログインしてください
          </p>

          {/* メールアドレス入力 */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* パスワード入力（表示のみ） */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              パスワード
            </label>
            <input
              type="password"
              placeholder="パスワードを入力"
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400"
            />
            <p className="text-sm text-blue-500 mt-1">
              ※ デモ版のためパスワードは不要です
            </p>
          </div>

          {/* ログインボタン */}
          <button 
            onClick={() => setUser({ email: 'demo@example.com' })}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium mb-4 transition-colors"
          >
            ログイン
          </button>

          <div className="text-center text-gray-500 mb-4">
            または
          </div>

          {/* Google ログインボタン */}
          <button
            onClick={() => setUser({ email: 'google-user@example.com' })}
            className="w-full py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 mb-4 flex items-center justify-center transition-colors"
          >
            <span className="mr-2">G</span>
            Googleでログイン
          </button>

          {/* クイックアクセスボタン */}
          <button
            onClick={() => setUser({ email: 'demo@quickaccess.com' })}
            className="w-full py-3 rounded-lg font-medium border border-green-300 hover:bg-green-50 text-green-600 mb-4 transition-colors"
          >
            🚀 クイックアクセス（デモ）
          </button>

          {/* 新規登録リンク */}
          <div className="text-center">
            <span className="text-gray-500 text-sm">
              アカウントをお持ちでない方は{' '}
            </span>
            <button className="text-blue-500 text-sm hover:underline">
              新規登録
            </button>
          </div>
        </div>
      </div>
    );
  }

  // メインアプリ画面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto pt-8 pb-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI瞬間英作文チャット</h1>
          <p className="text-gray-600 text-sm">AIが瞬時に添削・評価します</p>
        </div>
        
        {/* ユーザー情報とログアウト */}
        <div className="flex justify-between items-center mt-6 px-4 mb-4">
          <div className="text-sm text-gray-600">
            ログイン中: {user.email}
          </div>
          <button 
            onClick={() => setUser(null)}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded-md text-red-700 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* レベル選択 */}
      <div className="max-w-md mx-auto space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 px-2">レベルを選択してください</h2>
        
        {/* TOEIC */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">TOEIC</h3>
              <p className="text-sm text-gray-600">ビジネス英語・資格対策</p>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </div>

        {/* 中学英語 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xl">📚</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">中学英語</h3>
              <p className="text-sm text-gray-600">基礎からしっかり学習</p>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </div>

        {/* 高校英語 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <span className="text-xl">🎓</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">高校英語</h3>
              <p className="text-sm text-gray-600">受験対策・実用英語</p>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<DirectLoginApp />);
