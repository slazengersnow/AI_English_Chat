import React, { useState } from "react";

interface LoginWithBypassProps {
  onBypassLogin: () => void;
}

export default function LoginWithBypass({ onBypassLogin }: LoginWithBypassProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login attempt
    setTimeout(() => {
      setIsLoading(false);
      alert("ログイン機能は現在開発中です。ログイン回避ボタンをご利用ください。");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">英作文トレーニング</h1>
          <p className="text-gray-600 text-sm">AIが瞬時に添削・評価します</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="パスワードを入力"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">または</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Bypass Button */}
        <button
          onClick={onBypassLogin}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          🚀 ログイン回避（開発用）
        </button>

        {/* Additional Links */}
        <div className="mt-6 text-center space-y-2">
          <div className="text-sm text-gray-600">
            <a href="#" className="text-blue-600 hover:text-blue-800">パスワードを忘れた方</a>
          </div>
          <div className="text-sm text-gray-600">
            アカウントをお持ちでない方は{" "}
            <a href="#" className="text-blue-600 hover:text-blue-800">新規登録</a>
          </div>
        </div>
      </div>
    </div>
  );
}