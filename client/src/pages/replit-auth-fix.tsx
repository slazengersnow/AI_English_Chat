import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createReplitSupabaseClient, getOAuthRedirectURL, executeReplitGoogleOAuth } from '@/lib/replit-oauth-config';

export default function ReplitAuthFix() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [domainInfo, setDomainInfo] = useState<any>({});

  useEffect(() => {
    // ドメイン情報を収集
    const info = {
      currentOrigin: window.location.origin,
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      isReplitDev: window.location.hostname.includes('replit.dev'),
      isReplitApp: window.location.hostname.includes('replit.app'),
      redirectUrl: getOAuthRedirectURL(),
      timestamp: new Date().toISOString()
    };
    
    setDomainInfo(info);
    console.log('🔍 Replit認証環境情報:', info);
  }, []);

  const handleReplitGoogleOAuth = async () => {
    setIsLoading(true);
    setStatus('Replit環境でGoogle OAuth実行中...');
    
    try {
      const result = await executeReplitGoogleOAuth();
      
      if (result.error) {
        setStatus(`OAuth エラー: ${result.error.message}`);
      } else {
        setStatus('Google OAuth開始成功 - リダイレクト中...');
        // OAuth URLが生成された場合、自動的にリダイレクトされる
      }
    } catch (error: any) {
      setStatus(`OAuth 例外: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectLogin = async () => {
    setIsLoading(true);
    setStatus('管理者直接ログイン中...');
    
    try {
      const supabase = await createReplitSupabaseClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin.new@gmail.com',
        password: 's05936623',
      });

      if (error) {
        setStatus(`ログインエラー: ${error.message}`);
        console.error('Direct login error:', error);
      } else {
        setStatus('ログイン成功！ホームページにリダイレクト中...');
        console.log('Direct login success:', data);
        
        localStorage.setItem('auth_method', 'replit_direct');
        localStorage.setItem('user_email', 'admin.new@gmail.com');
        
        setTimeout(() => {
          setLocation('/');
        }, 1500);
      }
    } catch (error: any) {
      setStatus(`ログイン例外: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBypassAuth = () => {
    setStatus('認証バイパス起動中...');
    
    // Replit環境での認証バイパス
    localStorage.setItem('replit_auth_bypass', 'true');
    localStorage.setItem('demo_mode', 'active');
    localStorage.setItem('user_email', 'admin.new@gmail.com');
    localStorage.setItem('user_role', 'admin');
    localStorage.setItem('session_active', 'true');
    localStorage.setItem('auth_timestamp', new Date().toISOString());
    
    setTimeout(() => {
      setLocation('/');
    }, 1000);
  };

  const getDomainBadgeVariant = () => {
    if (domainInfo.isReplitDev) return 'default';
    if (domainInfo.isReplitApp) return 'secondary';
    return 'outline';
  };

  const getDomainLabel = () => {
    if (domainInfo.isReplitDev) return 'Replit Dev';
    if (domainInfo.isReplitApp) return 'Replit App';
    return 'External';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-100">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-purple-700">
            🔧 Replit認証修正
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Replit環境に最適化された認証システム
          </p>
          <div className="flex justify-center mt-2">
            <Badge variant={getDomainBadgeVariant()}>
              {getDomainLabel()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg text-sm space-y-2">
            <h4 className="font-semibold text-purple-800">環境情報:</h4>
            <div className="text-purple-700 space-y-1">
              <p><strong>ドメイン:</strong> {domainInfo.hostname}</p>
              <p><strong>Origin:</strong> {domainInfo.currentOrigin}</p>
              <p><strong>リダイレクトURL:</strong> {domainInfo.redirectUrl}</p>
              <p><strong>Replit Dev:</strong> {domainInfo.isReplitDev ? '✅' : '❌'}</p>
              <p><strong>Replit App:</strong> {domainInfo.isReplitApp ? '✅' : '❌'}</p>
            </div>
          </div>
          
          <Button 
            onClick={handleReplitGoogleOAuth} 
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? "認証中..." : "Replit Google OAuth"}
          </Button>
          
          <Button 
            onClick={handleDirectLogin} 
            className="w-full"
            variant="outline"
            disabled={isLoading}
          >
            管理者直接ログイン
          </Button>
          
          <Button 
            onClick={handleBypassAuth} 
            className="w-full"
            variant="secondary"
            disabled={isLoading}
          >
            認証バイパス（Replit用）
          </Button>
          
          {status && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <p className="font-medium text-blue-800">ステータス:</p>
              <p className="text-blue-700">{status}</p>
            </div>
          )}
          
          <div className="text-xs text-gray-500 text-center pt-4 border-t">
            <p>Replit環境での認証問題を解決する特別なページです</p>
            <p>Preview制限を回避し、適切なドメイン設定を使用します</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}