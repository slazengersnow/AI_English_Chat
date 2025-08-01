import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@supabase/supabase-js';

export default function EmergencyAuthFix() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState('admin.new@gmail.com');
  const [password, setPassword] = useState('s05936623');

  // Create completely fresh Supabase client
  const freshSupabase = createClient(
    'https://xcjplyhqxgrbdhixmzse.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjanlseXFoeGdyYmRoaXhtenNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNjExMjMsImV4cCI6MjA1MDkzNzEyM30.XZaYqFdXF9XZQEtJGXcvzuXGlhXRoZKOJ4PxzCnJgDo'
  );

  const handleDirectLogin = async () => {
    setStatus('ログイン試行中...');
    
    const currentDomain = window.location.origin;
    console.log('🔧 Emergency Auth - Current domain:', currentDomain);
    
    try {
      const { data, error } = await freshSupabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setStatus(`エラー: ${error.message}`);
        console.error('Login error:', error);
      } else {
        setStatus('ログイン成功！リダイレクト中...');
        console.log('Login success:', data);
        
        localStorage.setItem('emergency_auth', 'true');
        localStorage.setItem('user_email', email);
        
        setTimeout(() => {
          setLocation('/');
        }, 1500);
      }
    } catch (e) {
      setStatus(`例外: ${e.message}`);
      console.error('Login exception:', e);
    }
  };

  const handleFixedGoogleOAuth = async () => {
    setStatus('修正済みGoogle OAuth実行中...');
    
    const currentDomain = window.location.origin;
    const correctRedirectUrl = `${currentDomain}/auth/callback`;
    
    console.log('🔧 Emergency Google OAuth');
    console.log('✅ Current domain:', currentDomain);
    console.log('✅ Correct redirect:', correctRedirectUrl);
    
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
        setStatus(`OAuth エラー: ${error.message}`);
        console.error('OAuth error:', error);
      } else {
        setStatus('Google OAuth開始成功');
        console.log('OAuth success:', data);
        console.log('Redirect URL being used:', correctRedirectUrl);
      }
    } catch (e) {
      setStatus(`OAuth 例外: ${e.message}`);
      console.error('OAuth exception:', e);
    }
  };

  const handleForceBypass = () => {
    setStatus('認証強制バイパス中...');
    
    localStorage.setItem('demo_mode', 'active');
    localStorage.setItem('auth_bypass', 'true');
    localStorage.setItem('user_email', 'admin.new@gmail.com');
    localStorage.setItem('user_role', 'admin');
    localStorage.setItem('session_active', 'true');
    localStorage.setItem('emergency_access', 'true');
    
    setTimeout(() => {
      setLocation('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-red-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-red-700">🚨 緊急認証修正</CardTitle>
          <p className="text-sm text-gray-600">
            現在のドメイン: {window.location.origin}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
            />
          </div>
          
          <Button onClick={handleDirectLogin} className="w-full">
            直接ログイン（修正済み）
          </Button>
          
          <Button 
            onClick={handleFixedGoogleOAuth} 
            className="w-full bg-red-600 hover:bg-red-700"
          >
            修正済みGoogle OAuth
          </Button>
          
          <Button 
            onClick={handleForceBypass} 
            className="w-full" 
            variant="outline"
          >
            強制認証バイパス
          </Button>
          
          {status && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <p className="text-blue-700">{status}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}