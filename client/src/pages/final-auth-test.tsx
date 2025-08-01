import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@supabase/supabase-js';

export default function FinalAuthTest() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Create a completely fresh Supabase client
  const freshSupabase = createClient(
    'https://xcjplyhqxgrbdhixmzse.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjanlseXFoeGdyYmRoaXhtenNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNjExMjMsImV4cCI6MjA1MDkzNzEyM30.XZaYqFdXF9XZQEtJGXcvzuXGlhXRoZKOJ4PxzCnJgDo'
  );

  const handleFreshGoogleOAuth = async () => {
    setIsLoading(true);
    setStatus('新しいSupabaseクライアントでGoogle OAuth実行中...');
    
    const currentDomain = window.location.origin;
    const correctRedirectUrl = `${currentDomain}/auth/callback`;
    
    console.log('🆕 Fresh Supabase Client - Google OAuth');
    console.log('✅ Correct redirect URL:', correctRedirectUrl);
    console.log('❌ Should NOT use:', 'https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app/auth/callback');
    
    try {
      const { data, error } = await freshSupabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: correctRedirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setStatus(`エラー: ${error.message}`);
        console.error('Fresh OAuth error:', error);
      } else {
        setStatus('Google OAuth開始成功 - リダイレクト中...');
        console.log('Fresh OAuth success:', data);
        console.log('OAuth URL:', data.url);
      }
    } catch (e) {
      setStatus(`例外: ${e.message}`);
      console.error('Fresh OAuth exception:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectAdminLogin = async () => {
    setIsLoading(true);
    setStatus('管理者直接ログイン中...');
    
    try {
      const { data, error } = await freshSupabase.auth.signInWithPassword({
        email: 'admin.new@gmail.com',
        password: 's05936623',
      });

      if (error) {
        setStatus(`ログインエラー: ${error.message}`);
        console.error('Direct login error:', error);
      } else {
        setStatus('ログイン成功！ホームページにリダイレクト中...');
        console.log('Direct login success:', data);
        
        // Store auth state
        localStorage.setItem('auth_method', 'fresh_direct');
        localStorage.setItem('user_email', 'admin.new@gmail.com');
        
        setTimeout(() => {
          setLocation('/');
        }, 1500);
      }
    } catch (e) {
      setStatus(`ログイン例外: ${e.message}`);
      console.error('Direct login exception:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoBypass = () => {
    setStatus('デモモード起動中...');
    
    // Set comprehensive demo state
    localStorage.setItem('demo_mode', 'active');
    localStorage.setItem('auth_bypass', 'true');
    localStorage.setItem('user_email', 'admin.new@gmail.com');
    localStorage.setItem('user_role', 'admin');
    localStorage.setItem('session_active', 'true');
    
    setTimeout(() => {
      setLocation('/');
    }, 1000);
  };

  const currentDomain = window.location.origin;
  const correctRedirectUrl = `${currentDomain}/auth/callback`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-blue-100">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-700">🎯 最終認証テスト</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            新しいSupabaseクライアントで完全に修正された認証
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <h4 className="font-semibold text-blue-800">設定情報:</h4>
            <p className="text-blue-700">現在のドメイン: {currentDomain}</p>
            <p className="text-blue-700">リダイレクトURL: {correctRedirectUrl}</p>
            <p className="text-green-700 font-medium">✅ 新しいSupabaseクライアント使用</p>
          </div>
          
          <Button 
            onClick={handleFreshGoogleOAuth} 
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? "認証中..." : "修正済みGoogle OAuth"}
          </Button>
          
          <Button 
            onClick={handleDirectAdminLogin} 
            className="w-full"
            variant="outline"
            disabled={isLoading}
          >
            管理者直接ログイン
          </Button>
          
          <Button 
            onClick={handleDemoBypass} 
            className="w-full"
            variant="secondary"
            disabled={isLoading}
          >
            デモモード強制起動
          </Button>
          
          {status && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="font-medium text-yellow-800">ステータス:</p>
              <p className="text-yellow-700">{status}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}