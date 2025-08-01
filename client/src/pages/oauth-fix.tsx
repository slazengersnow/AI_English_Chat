import React, { useEffect, useState } from 'react';
import { supabase } from '@shared/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OAuthFix() {
  const [status, setStatus] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    const currentDomain = window.location.origin;
    const correctUrl = `${currentDomain}/auth/callback`;
    setRedirectUrl(correctUrl);
  }, []);

  const testGoogleOAuth = async () => {
    setStatus('Google OAuth テスト中...');
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setStatus(`エラー: ${error.message}`);
      } else {
        setStatus('Google OAuth開始成功 - リダイレクト中...');
      }
    } catch (e) {
      setStatus(`例外: ${e.message}`);
    }
  };

  const activateDemo = () => {
    setStatus('デモモード起動中...');
    
    localStorage.setItem('demo_mode', 'active');
    localStorage.setItem('auth_bypass', 'true');
    localStorage.setItem('user_email', 'admin.new@gmail.com');
    
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  const directLogin = async () => {
    setStatus('直接ログイン試行中...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin.new@gmail.com',
        password: 's05936623',
      });

      if (error) {
        setStatus(`ログインエラー: ${error.message}`);
      } else {
        setStatus('ログイン成功 - リダイレクト中...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } catch (e) {
      setStatus(`ログイン例外: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>OAuth修正 & アクセステスト</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>現在のリダイレクトURL:</p>
            <code className="text-xs bg-gray-100 p-1 rounded">{redirectUrl}</code>
          </div>
          
          <Button onClick={testGoogleOAuth} className="w-full">
            Google OAuth テスト
          </Button>
          
          <Button onClick={directLogin} className="w-full" variant="outline">
            管理者直接ログイン
          </Button>
          
          <Button onClick={activateDemo} className="w-full" variant="secondary">
            デモモード起動
          </Button>
          
          {status && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              {status}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}