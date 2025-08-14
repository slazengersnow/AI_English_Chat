import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../providers/auth-provider";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/queryClient";

export default function AuthTestComplete() {
  const [email, setEmail] = useState("slazengersnow@gmail.com");
  const [password, setPassword] = useState("s45352512");
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  const clearLogs = () => setLogs([]);

  const testFullFlow = async () => {
    setLoading(true);
    clearLogs();
    
    try {
      addLog('🧪 Starting comprehensive authentication test...');
      
      // Step 1: Check initial state
      addLog('📊 Step 1: Checking initial auth state');
      const { data: initialSession } = await supabase.auth.getSession();
      addLog(`- Initial session: ${initialSession.session ? 'exists' : 'none'}`);
      addLog(`- AuthProvider: user=${!!auth.user}, initialized=${auth.initialized}`);
      
      // Step 2: Logout if already logged in
      if (initialSession.session) {
        addLog('🚪 Step 2: Logging out existing session');
        await supabase.auth.signOut();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Step 3: Login
      addLog('🔐 Step 3: Attempting login');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (loginError) {
        addLog(`❌ Login failed: ${loginError.message}`);
        return;
      }
      
      addLog(`✅ Login successful: ${loginData.user?.email}`);
      addLog(`- Session exists: ${!!loginData.session}`);
      addLog(`- Access token: ${loginData.session?.access_token ? 'present' : 'missing'}`);
      
      // Step 4: Wait for AuthProvider update
      addLog('⏳ Step 4: Waiting for AuthProvider to update');
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog(`- AuthProvider after login: user=${!!auth.user}, email=${auth.user?.email}`);
      
      // Step 5: Test API calls with auth
      addLog('📡 Step 5: Testing authenticated API calls');
      
      try {
        const progressData = await apiRequest('/api/progress-report');
        addLog(`✅ Progress API successful: ${JSON.stringify(progressData)}`);
      } catch (error: any) {
        addLog(`❌ Progress API failed: ${error.message}`);
      }
      
      try {
        const reviewData = await apiRequest('/api/review-list');
        addLog(`✅ Review API successful: got ${reviewData?.length || 0} items`);
      } catch (error: any) {
        addLog(`❌ Review API failed: ${error.message}`);
      }
      
      // Step 6: Final verification
      addLog('🔍 Step 6: Final state verification');
      const { data: finalSession } = await supabase.auth.getSession();
      addLog(`- Final session: ${finalSession.session ? 'active' : 'none'}`);
      addLog(`- Final auth state: user=${!!auth.user}, initialized=${auth.initialized}`);
      
      if (finalSession.session && auth.user) {
        addLog('🎉 Authentication flow completed successfully!');
        addLog('🚀 You should now be able to access protected routes');
      } else {
        addLog('⚠️  Authentication flow incomplete - checking for issues...');
      }
      
    } catch (error: any) {
      addLog(`💥 Test failed with exception: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectNavigation = () => {
    addLog('🚀 Testing direct navigation to home page...');
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">完全認証テスト</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">テスト設定</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password:</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button onClick={testFullFlow} disabled={loading} className="w-full">
            {loading ? '実行中...' : '完全フローテスト'}
          </Button>
          <Button onClick={testDirectNavigation} variant="outline">
            ホームページ移動テスト
          </Button>
          <Button onClick={clearLogs} variant="outline">
            ログクリア
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">テストログ:</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">テストを実行してください...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
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
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>現在の認証状態: {auth.user ? `ログイン済み (${auth.user.email})` : '未ログイン'}</p>
          <p>初期化状態: {auth.initialized ? '完了' : '未完了'}</p>
        </div>
      </div>
    </div>
  );
}