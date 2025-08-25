import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

interface LoginScreenProps {
  onLogin: (userInfo: { email: string }) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');

  const handleQuickLogin = () => {
    onLogin({ email: 'demo@example.com' });
  };

  const handleEmailLogin = () => {
    if (email.trim()) {
      onLogin({ email: email.trim() });
    }
  };

  const handleGoogleLogin = () => {
    // Google ログインの代わりにデモアクセス
    onLogin({ email: 'google-user@example.com' });
  };

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
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pl-10"
            />
            <div className="absolute left-3 top-3.5 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>
        </div>

        {/* パスワード入力（表示のみ、実際は不要） */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            パスワード
          </label>
          <div className="relative">
            <input
              type="password"
              placeholder="パスワードを入力"
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 pl-10 text-gray-400"
            />
            <div className="absolute left-3 top-3.5 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="absolute right-3 top-3.5 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-blue-500 mt-1">
            ※ デモ版のためパスワードは不要です
          </p>
        </div>

        {/* ログインボタン */}
        <Button 
          onClick={handleEmailLogin}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium mb-4"
        >
          ログイン
        </Button>

        <div className="text-center text-gray-500 mb-4">
          または
        </div>

        {/* Google ログインボタン */}
        <Button
          onClick={handleGoogleLogin}
          variant="outline"
          className="w-full py-3 rounded-lg font-medium border-gray-300 hover:bg-gray-50 mb-4 flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Googleでログイン
        </Button>

        {/* クイックアクセスボタン */}
        <Button
          onClick={handleQuickLogin}
          variant="outline"
          className="w-full py-3 rounded-lg font-medium border-green-300 hover:bg-green-50 text-green-600 mb-4"
        >
          🚀 クイックアクセス（デモ）
        </Button>

        {/* アカウント作成リンク */}
        <div className="text-center">
          <span className="text-gray-500 text-sm">
            アカウントをお持ちでない方は{' '}
          </span>
          <button className="text-blue-500 text-sm hover:underline">
            アカウント作成
          </button>
        </div>
      </div>
    </div>
  );
}