import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../providers/auth-provider";
import { Button } from "../components/ui/button";

export default function LoginDebug() {
  const [email, setEmail] = useState("slazengersnow@gmail.com");
  const [password, setPassword] = useState("s45352512");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const auth = useAuth();

  const addResult = (message: string) => {
    console.log(message);
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSupabaseConnection = async () => {
    setTestResults([]);
    addResult('🧪 Testing Supabase connection...');
    
    try {
      // Test connection
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        addResult(`❌ Session error: ${error.message}`);
      } else {
        addResult(`✅ Supabase connection OK`);
        addResult(`📊 Current session: ${data.session ? 'exists' : 'none'}`);
      }

      // Test environment variables
      addResult(`🔧 Environment check:`);
      addResult(`- VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? 'set' : 'missing'}`);
      addResult(`- VITE_SUPABASE_ANON_KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'set' : 'missing'}`);
      
      if ((window as any).SUPA_DEBUG) {
        addResult(`🐛 Debug info: ${JSON.stringify((window as any).SUPA_DEBUG)}`);
      }
    } catch (e: any) {
      addResult(`💥 Connection test failed: ${e.message}`);
    }
  };

  const testLogin = async () => {
    setMsg(null);
    setLoading(true);
    setTestResults([]);
    
    try {
      addResult(`🔐 Attempting login with: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        addResult(`❌ Login error: ${error.message}`);
        setMsg(`ログイン失敗: ${error.message}`);
        return;
      }
      
      addResult(`✅ Login API successful`);
      addResult(`📊 Login data: session=${!!data.session}, user=${!!data.user}`);
      
      if (data.user) {
        addResult(`👤 User: ${data.user.email}`);
        addResult(`📅 Email confirmed: ${data.user.email_confirmed_at ? 'yes' : 'no'}`);
        addResult(`🔑 User ID: ${data.user.id}`);
      }
      
      // Check session after login
      const { data: sessionData } = await supabase.auth.getSession();
      addResult(`🔍 Session check: ${sessionData.session ? 'active' : 'none'}`);
      
      setMsg("ログイン成功！セッション確認中...");
      
      // Wait a moment for AuthProvider to update
      setTimeout(() => {
        addResult(`🏠 AuthProvider state: user=${!!auth.user}, initialized=${auth.initialized}`);
      }, 1000);
      
    } catch (e: any) {
      addResult(`💥 Login exception: ${e.message}`);
      setMsg(`ログインエラー: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuthProvider = () => {
    setTestResults([]);
    addResult('🧪 Testing AuthProvider state...');
    addResult(`📊 Auth state: user=${!!auth.user}, initialized=${auth.initialized}`);
    addResult(`👤 User email: ${auth.user?.email || 'none'}`);
    addResult(`🔐 User ID: ${auth.user?.id || 'none'}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">ログインデバッグテスト</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">ログインテスト</h2>
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
            <Button onClick={testLogin} disabled={loading} className="w-full">
              {loading ? 'ログイン中...' : 'ログインテスト実行'}
            </Button>
            {msg && <p className="text-center text-sm">{msg}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button onClick={testSupabaseConnection}>
            Supabase接続テスト
          </Button>
          <Button onClick={testAuthProvider}>
            AuthProvider状態確認
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
            通常ログインページに戻る
          </Button>
        </div>
      </div>
    </div>
  );
}