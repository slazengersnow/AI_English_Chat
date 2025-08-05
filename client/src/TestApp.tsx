import React from "react";

export default function TestApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🚀 AI瞬間英作文チャット
        </h1>
        <p className="text-gray-600 mb-6">メインアプリケーションテスト中</p>
        
        <div className="space-y-4">
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors">
            1問練習
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
              TOEIC
            </button>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
              中学校
            </button>
            <button className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
              高校
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
              基本動詞
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}