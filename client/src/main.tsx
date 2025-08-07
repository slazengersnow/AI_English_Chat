import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import AdminDashboard from "./AdminDashboard";
import "./index.css";

function MainApp() {
  const [currentPage, setCurrentPage] = useState<'menu' | 'admin'>('menu');

  if (currentPage === 'admin') {
    return <AdminDashboard onBackToMenu={() => setCurrentPage('menu')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto pt-8 pb-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI瞬間英作文チャット</h1>
          <p className="text-gray-600 text-sm">AIが瞬時に添削・評価します</p>
        </div>
        
        {/* User Info and Admin Button */}
        <div className="mt-6 px-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              ログイン中: admin@example.com
            </div>
            <button 
              onClick={() => console.log('Logout')}
              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded-md text-red-700 transition-colors"
            >
              ログアウト
            </button>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setCurrentPage('admin')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors flex items-center space-x-1"
            >
              <span>🛡️</span>
              <span>管理者</span>
            </button>
            <button 
              onClick={() => console.log('My Page')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors flex items-center space-x-1"
            >
              <span>👤</span>
              <span>マイページ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Level Selection Cards */}
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

        {/* 基本動詞 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
              <span className="text-xl">🔧</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">基本動詞</h3>
              <p className="text-sm text-gray-600">get, make, takeなど</p>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </div>

        {/* ビジネスメール */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <span className="text-xl">📧</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">ビジネスメール</h3>
              <p className="text-sm text-gray-600">実務で使える表現</p>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </div>

        {/* シミュレーション練習 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">シミュレーション練習</h3>
              <p className="text-sm text-gray-600">会議・プレゼン・接客</p>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<MainApp />);
