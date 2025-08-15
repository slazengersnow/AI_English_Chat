import React, { useState } from "react";

export default function NetworkCorsTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  const clearLogs = () => setLogs([]);

  const testCorsWithSupabase = async () => {
    addLog('🌐 CORS設定テスト開始...');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      addLog('❌ 環境変数が設定されていません');
      return false;
    }
    
    try {
      // Test 1: Simple GET request
      addLog('📡 テスト1: シンプルGETリクエスト');
      const response1 = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        }
      });
      addLog(`📡 結果1: ${response1.status} ${response1.statusText}`);
      
      // Test 2: OPTIONS preflight request
      addLog('📡 テスト2: OPTIONSプリフライトリクエスト');
      const response2 = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,Authorization'
        }
      });
      addLog(`📡 結果2: ${response2.status} ${response2.statusText}`);
      
      // Test 3: POST request to auth
      addLog('📡 テスト3: 認証POSTリクエスト');
      const response3 = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'invalid'
        })
      });
      addLog(`📡 結果3: ${response3.status} ${response3.statusText}`);
      
      return true;
    } catch (error: any) {
      addLog(`❌ CORSテストエラー: ${error.message}`);
      if (error.message.includes('CORS')) {
        addLog('⚠️ CORS制限が検出されました');
      }
      return false;
    }
  };

  const testReplitNetworkLimits = async () => {
    addLog('🔒 Replitネットワーク制限テスト開始...');
    
    // Test external HTTPS connections
    const testUrls = [
      'https://httpbin.org/get',
      'https://api.github.com',
      'https://jsonplaceholder.typicode.com/posts/1'
    ];
    
    for (const url of testUrls) {
      try {
        addLog(`📡 テスト中: ${url}`);
        const response = await fetch(url);
        addLog(`✅ 成功: ${url} -> ${response.status}`);
      } catch (error: any) {
        addLog(`❌ 失敗: ${url} -> ${error.message}`);
      }
    }
  };

  const testBrowserSecurityFeatures = () => {
    addLog('🔐 ブラウザセキュリティ機能テスト開始...');
    
    // Check iframe context
    const isInIframe = window !== window.top;
    addLog(`📊 iframe内実行: ${isInIframe ? 'Yes' : 'No'}`);
    
    // Check localStorage availability
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      addLog('✅ localStorage: 利用可能');
    } catch (error) {
      addLog('❌ localStorage: 制限されています');
    }
    
    // Check cookie support
    try {
      document.cookie = 'test=test; SameSite=None; Secure';
      const hasCookie = document.cookie.includes('test=test');
      addLog(`${hasCookie ? '✅' : '❌'} Cookie: ${hasCookie ? '利用可能' : '制限されています'}`);
    } catch (error) {
      addLog('❌ Cookie: 制限されています');
    }
    
    // Check WebSocket support
    try {
      const ws = new WebSocket('wss://echo.websocket.org');
      ws.onopen = () => {
        addLog('✅ WebSocket: 利用可能');
        ws.close();
      };
      ws.onerror = () => {
        addLog('❌ WebSocket: 制限されています');
      };
    } catch (error) {
      addLog('❌ WebSocket: 制限されています');
    }
    
    // Check fetch with credentials
    addLog('📡 Fetch with credentials テスト...');
    fetch('/api/health', { credentials: 'include' })
      .then(response => addLog(`✅ Credentials: ${response.status}`))
      .catch(error => addLog(`❌ Credentials: ${error.message}`));
  };

  const testSupabaseSpecificIssues = async () => {
    addLog('🔧 Supabase固有の問題テスト開始...');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      addLog('❌ 環境変数が設定されていません');
      return;
    }
    
    try {
      // Test 1: Check if Supabase URL is reachable
      addLog('📡 Supabase URL到達性テスト...');
      const healthResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: { 'apikey': supabaseAnonKey }
      });
      addLog(`📡 Supabase Health: ${healthResponse.status} ${healthResponse.statusText}`);
      
      // Test 2: Check auth endpoint specifically
      addLog('📡 Auth エンドポイントテスト...');
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { 'apikey': supabaseAnonKey }
      });
      addLog(`📡 Auth Endpoint: ${authResponse.status} ${authResponse.statusText}`);
      
      // Test 3: Check realtime capabilities
      addLog('📡 Realtime機能テスト...');
      const realtimeUrl = supabaseUrl.replace('https://', 'wss://') + '/realtime/v1/websocket';
      
      try {
        const ws = new WebSocket(realtimeUrl + '?apikey=' + supabaseAnonKey);
        ws.onopen = () => {
          addLog('✅ Realtime WebSocket: 接続成功');
          ws.close();
        };
        ws.onerror = (error) => {
          addLog('❌ Realtime WebSocket: 接続失敗');
        };
      } catch (wsError) {
        addLog('❌ Realtime WebSocket: 初期化失敗');
      }
      
    } catch (error: any) {
      addLog(`❌ Supabaseテストエラー: ${error.message}`);
    }
  };

  const generateCorsFixInstructions = () => {
    addLog('');
    addLog('=== CORS問題の解決方法 ===');
    addLog('');
    addLog('1. Supabaseダッシュボードでの設定:');
    addLog('   - Settings > API > CORS Origins に以下を追加:');
    addLog('   - *.replit.dev');
    addLog('   - https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev');
    addLog('   - http://localhost:5000');
    addLog('');
    addLog('2. Replitでの環境変数確認:');
    addLog('   - Secrets タブで VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を確認');
    addLog('   - 値が正確で最新であることを確認');
    addLog('');
    addLog('3. Content Security Policy の調整:');
    addLog('   - client/index.html の CSP メタタグで connect-src を調整');
    addLog('   - Supabase ドメイン (*.supabase.co, *.supabase.in) を許可');
    addLog('');
    addLog('4. プロキシの使用 (最後の手段):');
    addLog('   - サーバー側でSupabaseへのプロキシエンドポイントを作成');
    addLog('   - フロントエンドからはサーバー経由でアクセス');
  };

  const runCompleteNetworkTest = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    clearLogs();
    addLog('🧪 完全ネットワーク診断開始...');
    
    try {
      addLog('');
      addLog('=== ステップ 1: ブラウザセキュリティ機能チェック ===');
      testBrowserSecurityFeatures();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addLog('');
      addLog('=== ステップ 2: Replitネットワーク制限テスト ===');
      await testReplitNetworkLimits();
      
      addLog('');
      addLog('=== ステップ 3: CORS設定テスト ===');
      await testCorsWithSupabase();
      
      addLog('');
      addLog('=== ステップ 4: Supabase固有問題テスト ===');
      await testSupabaseSpecificIssues();
      
      generateCorsFixInstructions();
      
    } catch (error: any) {
      addLog(`❌ テスト実行エラー: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>ネットワーク・CORS診断ツール</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={runCompleteNetworkTest}
          disabled={isRunning}
          style={{ 
            padding: '12px 24px',
            backgroundColor: isRunning ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isRunning ? 'ネットワーク診断中...' : '完全ネットワーク診断'}
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
        <h3 style={{ marginTop: '0' }}>診断ログ:</h3>
        <div style={{ 
          backgroundColor: '#1e1e1e', 
          color: '#00ff00', 
          padding: '15px', 
          borderRadius: '4px', 
          fontFamily: 'Monaco, Consolas, monospace',
          fontSize: '12px',
          maxHeight: '500px', 
          overflowY: 'auto',
          whiteSpace: 'pre-wrap'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#666' }}>ネットワーク診断を実行してください...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>{log}</div>
            ))
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
        <h4>このツールについて:</h4>
        <p>このツールは以下のネットワーク関連問題を診断します：</p>
        <ul>
          <li><strong>ブラウザセキュリティ</strong>: iframe制限、localStorage、Cookie、WebSocket</li>
          <li><strong>Replitネットワーク制限</strong>: 外部API接続テスト</li>
          <li><strong>CORS設定</strong>: Supabaseとの通信でのCROS問題</li>
          <li><strong>Supabase固有問題</strong>: Auth、Realtime接続テスト</li>
        </ul>
        <p><strong>注意:</strong> このツールはネットワーク接続問題の根本原因特定に特化しています。</p>
      </div>
    </div>
  );
}