import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function SimpleAuthTest() {
  const [email, setEmail] = useState("slazengersnow@gmail.com");
  const [password, setPassword] = useState("s45352512");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    setStatus("");
    
    try {
      console.log("🧪 Starting simple auth test...");
      setStatus("認証テスト開始...");
      
      // Step 1: Clear any existing session
      await supabase.auth.signOut();
      console.log("✅ Signed out existing session");
      setStatus("既存セッション終了...");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Attempt login
      console.log("🔐 Attempting login...");
      setStatus("ログイン試行中...");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      
      if (error) {
        console.error("❌ Login failed:", error);
        setStatus(`ログイン失敗: ${error.message}`);
        return;
      }
      
      console.log("✅ Login successful:", data);
      setStatus(`ログイン成功: ${data.user?.email}`);
      
      // Step 3: Verify session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("📊 Session check:", sessionData);
      
      if (sessionData.session) {
        setStatus(`✅ セッション確認済み: ${sessionData.session.user.email}`);
        console.log("🎉 Authentication successful! Redirecting...");
        
        // Redirect to main app
        setTimeout(() => {
          window.open('/', '_blank');
        }, 1000);
      } else {
        setStatus("❌ セッションが見つかりません");
      }
      
    } catch (error: any) {
      console.error("💥 Auth test failed:", error);
      setStatus(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectAPI = async () => {
    try {
      setStatus("API接続テスト中...");
      
      const response = await fetch('/api/progress-report');
      console.log("API Response:", response);
      
      if (response.ok) {
        const data = await response.json();
        console.log("API Data:", data);
        setStatus(`API成功: ${JSON.stringify(data)}`);
      } else {
        setStatus(`API失敗: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      setStatus(`APIエラー: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
      <h1>シンプル認証テスト</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '5px 0' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '5px 0' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testAuth} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'テスト中...' : '認証テスト実行'}
        </button>
        
        <button 
          onClick={testDirectAPI}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          API直接テスト
        </button>
      </div>

      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6',
        minHeight: '60px'
      }}>
        <h3>ステータス:</h3>
        <p>{status || "テストを実行してください"}</p>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>注意:</strong> このページはiframeの制限を回避するために作られました。</p>
        <p>Replit プレビューではなく、新しいタブで直接URLにアクセスしてテストしてください。</p>
        <p><strong>URL:</strong> <a href="/simple-auth-test" target="_blank">/simple-auth-test</a></p>
      </div>
    </div>
  );
}