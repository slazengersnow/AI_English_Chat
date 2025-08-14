import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../providers/auth-provider';
import { Button } from '../components/ui/button';

export default function AuthDebugTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();

  const addResult = (message: string) => {
    console.log(message);
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSignupFlow = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('🧪 Testing signup flow...');
      
      // Test with a test email
      const testEmail = `test.${Date.now()}@example.com`;
      const testPassword = 'testpass123';
      
      addResult(`📧 Attempting signup with: ${testEmail}`);
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: { emailRedirectTo: `${window.location.origin}/auth-callback` }
      });
      
      if (error) {
        addResult(`❌ Signup error: ${error.message}`);
        if (error.message?.toLowerCase().includes('already')) {
          addResult('✅ Existing email detection working correctly');
        }
      } else {
        addResult('✅ Signup API call successful');
        addResult(`📊 Data received: user=${!!data.user}, session=${!!data.session}`);
        
        if (data.user && !data.session) {
          addResult('📮 Email confirmation required (as expected)');
        } else if (data.user && data.session) {
          addResult('⚠️ Immediate session created (email confirmation might be OFF)');
        }
      }
      
    } catch (e: any) {
      addResult(`💥 Exception: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testExistingEmailSignup = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('🧪 Testing existing email signup...');
      
      // Use a known existing email
      const existingEmail = 'slazengersnow@gmail.com';
      const testPassword = 'testpass123';
      
      addResult(`📧 Attempting signup with existing email: ${existingEmail}`);
      
      const { data, error } = await supabase.auth.signUp({
        email: existingEmail,
        password: testPassword,
        options: { emailRedirectTo: `${window.location.origin}/auth-callback` }
      });
      
      if (error) {
        addResult(`✅ Error correctly detected: ${error.message}`);
      } else {
        addResult('⚠️ No error returned for existing email');
        addResult(`📊 Data: user=${!!data.user}, session=${!!data.session}`);
      }
      
    } catch (e: any) {
      addResult(`💥 Exception: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAuthProviderState = () => {
    setTestResults([]);
    addResult('🧪 Testing AuthProvider state...');
    addResult(`📊 AuthProvider state: initialized=${auth.initialized}, isLoading=${auth.isLoading}, hasUser=${!!auth.user}`);
    addResult(`👤 User email: ${auth.user?.email || 'none'}`);
    addResult(`🔐 Is authenticated: ${auth.isAuthenticated}`);
    addResult(`👨‍💼 Is admin: ${auth.isAdmin}`);
  };

  const testSessionPersistence = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('🧪 Testing session persistence...');
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        addResult(`❌ Session error: ${error.message}`);
      } else {
        addResult(`✅ Session check successful`);
        addResult(`📊 Current session: hasSession=${!!data.session}, hasUser=${!!data.session?.user}`);
        if (data.session?.user) {
          addResult(`👤 Session user: ${data.session.user.email}`);
          addResult(`📅 Confirmed at: ${data.session.user.email_confirmed_at || 'not confirmed'}`);
        }
      }
      
    } catch (e: any) {
      addResult(`💥 Exception: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">認証システムデバッグテスト</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button 
            onClick={testSignupFlow} 
            disabled={isLoading}
            className="h-12"
          >
            新規サインアップテスト
          </Button>
          
          <Button 
            onClick={testExistingEmailSignup} 
            disabled={isLoading}
            className="h-12"
          >
            既存メールサインアップテスト
          </Button>
          
          <Button 
            onClick={testAuthProviderState} 
            disabled={isLoading}
            className="h-12"
          >
            AuthProvider状態テスト
          </Button>
          
          <Button 
            onClick={testSessionPersistence} 
            disabled={isLoading}
            className="h-12"
          >
            セッション永続化テスト
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">テスト結果:</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-gray-500">テストを実行してください...</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">{result}</div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Button 
            onClick={() => window.location.href = '/login'}
            variant="outline"
          >
            ログインページに戻る
          </Button>
        </div>
      </div>
    </div>
  );
}