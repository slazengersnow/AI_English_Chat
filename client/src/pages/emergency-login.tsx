import React, { useState } from 'react';
import { supabase } from '@shared/supabase';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EmergencyLogin() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState('admin.new@gmail.com');
  const [password, setPassword] = useState('s05936623');

  const handleDirectLogin = async () => {
    setStatus('ログイン中...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setStatus(`エラー: ${error.message}`);
        console.error('Direct login error:', error);
      } else {
        setStatus('ログイン成功！リダイレクト中...');
        console.log('Direct login success:', data);
        
        // Store auth info
        localStorage.setItem('auth_method', 'emergency_direct');
        localStorage.setItem('user_email', email);
        
        setTimeout(() => {
          setLocation('/');
        }, 1000);
      }
    } catch (e) {
      setStatus(`例外: ${e.message}`);
      console.error('Direct login exception:', e);
    }
  };

  const handleCorrectGoogleOAuth = async () => {
    setStatus('修正されたGoogle OAuth実行中...');
    
    try {
      // Force use current domain
      const correctRedirectUrl = window.location.origin + '/auth/callback';
      console.log('🔧 Using correct redirect URL:', correctRedirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
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
        setStatus(`Google OAuth エラー: ${error.message}`);
        console.error('Fixed Google OAuth error:', error);
      } else {
        setStatus('Google OAuth開始成功 - Googleページへリダイレクト中...');
        console.log('Fixed Google OAuth success:', data);
      }
    } catch (e) {
      setStatus(`Google OAuth例外: ${e.message}`);
      console.error('Fixed Google OAuth exception:', e);
    }
  };

  const activateDemoMode = () => {
    setStatus('デモモード起動中...');
    
    // Set demo mode flags
    localStorage.setItem('demo_mode', 'active');
    localStorage.setItem('auth_bypass', 'true');
    localStorage.setItem('user_email', 'admin.new@gmail.com');
    localStorage.setItem('user_role', 'admin');
    
    setTimeout(() => {
      setLocation('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🚨 緊急ログイン</CardTitle>
          <p className="text-sm text-gray-600">
            OAuth問題の根本的解決とアクセス確保
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <Button onClick={handleDirectLogin} className="w-full">
            管理者直接ログイン
          </Button>
          
          <Button onClick={handleCorrectGoogleOAuth} className="w-full" variant="outline">
            修正済Google OAuth
          </Button>
          
          <Button onClick={activateDemoMode} className="w-full" variant="secondary">
            デモモード強制起動
          </Button>
          
          <div className="text-xs text-gray-500">
            <p>現在のドメイン: {window.location.origin}</p>
            <p>リダイレクトURL: {window.location.origin}/auth/callback</p>
          </div>
          
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