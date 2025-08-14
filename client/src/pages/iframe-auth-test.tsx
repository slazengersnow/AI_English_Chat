import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../providers/auth-provider";

export default function IframeAuthTest() {
  const [email, setEmail] = useState("slazengersnow@gmail.com");
  const [password, setPassword] = useState("s45352512");
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    // Check if running in iframe
    const inIframe = window !== window.top;
    setIsInIframe(inIframe);
    addLog(`🖼️ Running in iframe: ${inIframe ? 'Yes (プレビューモード)' : 'No (直接アクセス)'}`);
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  const clearLogs = () => setLogs([]);

  const testIframeCompatibleAuth = async () => {
    setLoading(true);
    clearLogs();
    
    try {
      addLog('🧪 Starting iframe-compatible auth test...');
      
      // Step 1: Check environment
      addLog(`🌍 Environment: iframe=${isInIframe}, localStorage=${typeof localStorage !== 'undefined'}`);
      
      // Step 2: Clear existing session safely
      try {
        await supabase.auth.signOut();
        addLog('✅ Signed out existing session');
      } catch (error: any) {
        addLog(`⚠️ Signout warning: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Attempt login with iframe-safe settings
      addLog('🔐 Attempting iframe-compatible login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      
      if (error) {
        addLog(`❌ Login failed: ${error.message}`);
        if (error.message.includes('fetch')) {
          addLog('🚨 CORS/iframe issue detected - trying alternative approach...');
          
          // Alternative: Direct API call
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });
            
            if (response.ok) {
              addLog('✅ Alternative login successful via server');
              window.location.reload();
              return;
            }
          } catch (apiError: any) {
            addLog(`❌ Alternative login also failed: ${apiError.message}`);
          }
        }
        return;
      }
      
      addLog(`✅ Login successful: ${data.user?.email}`);
      
      // Step 4: Verify session persistence
      const { data: sessionData } = await supabase.auth.getSession();
      addLog(`📊 Session check: ${sessionData.session ? 'Active' : 'None'}`);
      
      // Step 5: Test API calls
      addLog('📡 Testing API calls with authentication...');
      
      try {
        // Import the apiRequest function dynamically
        const { apiRequest } = await import('../lib/queryClient');
        
        const progressData = await apiRequest('/api/progress-report');
        addLog(`✅ API call successful: ${JSON.stringify(progressData).substring(0, 100)}...`);
        
        addLog('🎉 All tests passed! Authentication working in iframe mode.');
        
        if (isInIframe) {
          addLog('📱 Iframe detected - will redirect parent window...');
          setTimeout(() => {
            window.parent.location.href = '/';
          }, 2000);
        } else {
          addLog('🚀 Direct access - redirecting...');
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
        
      } catch (apiError: any) {
        addLog(`❌ API test failed: ${apiError.message}`);
        addLog('⚠️ Login successful but API calls failing - check token handling');
      }
      
    } catch (error: any) {
      addLog(`💥 Test failed: ${error.message}`);
      addLog('🔧 Troubleshooting tips:');
      addLog('- Try refreshing the page');
      addLog('- Check if Supabase credentials are correct');
      addLog('- Verify network connectivity');
    } finally {
      setLoading(false);
    }
  };

  const openInNewTab = () => {
    const url = window.location.href.replace(/\/iframe-auth-test.*/, '/simple-auth-test');
    window.open(url, '_blank');
    addLog('🔗 Opened in new tab - try the test there if iframe fails');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ 
        backgroundColor: isInIframe ? '#fff3cd' : '#d4edda', 
        padding: '10px', 
        borderRadius: '5px', 
        marginBottom: '20px',
        border: `1px solid ${isInIframe ? '#ffeaa7' : '#c3e6cb'}`
      }}>
        <strong>{isInIframe ? '⚠️ プレビューモード' : '✅ 直接アクセス'}</strong>
        <p>{isInIframe 
          ? 'Replitプレビュー内で実行中です。制限がある可能性があります。'
          : '新しいタブで直接アクセスしています。最適な環境です。'
        }</p>
      </div>

      <h1>iframe対応認証テスト</h1>
      
      <div style={{ marginBottom: '20px', display: 'grid', gap: '10px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            id="email"
            name="email"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            id="password"
            name="password"
          />
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={testIframeCompatibleAuth} 
          disabled={loading}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'テスト実行中...' : 'iframe対応認証テスト'}
        </button>
        
        <button 
          onClick={openInNewTab}
          style={{ 
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          新しいタブで開く
        </button>
        
        <button 
          onClick={clearLogs}
          style={{ 
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ログクリア
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        padding: '15px'
      }}>
        <h3 style={{ marginTop: '0' }}>テストログ:</h3>
        <div style={{ 
          backgroundColor: '#1e1e1e', 
          color: '#00ff00', 
          padding: '15px', 
          borderRadius: '4px', 
          fontFamily: 'Monaco, Consolas, monospace',
          fontSize: '12px',
          maxHeight: '400px', 
          overflowY: 'auto',
          whiteSpace: 'pre-wrap'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#666' }}>テストを実行してください...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>{log}</div>
            ))
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h4>現在の認証状態:</h4>
        <p><strong>ユーザー:</strong> {auth.user ? `${auth.user.email} (ログイン済み)` : '未ログイン'}</p>
        <p><strong>初期化:</strong> {auth.initialized ? '完了' : '未完了'}</p>
        <p><strong>環境:</strong> {isInIframe ? 'iframe/プレビューモード' : '直接アクセスモード'}</p>
      </div>
    </div>
  );
}