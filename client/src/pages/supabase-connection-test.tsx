import React, { useState } from "react";

export default function SupabaseConnectionTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  const clearLogs = () => setLogs([]);

  const testEnvironmentVariables = () => {
    addLog('🔧 環境変数のテスト開始...');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    addLog(`📊 VITE_SUPABASE_URL: ${supabaseUrl ? '設定済み (' + supabaseUrl.substring(0, 30) + '...)' : '未設定'}`);
    addLog(`📊 VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '設定済み (' + supabaseAnonKey.substring(0, 20) + '...)' : '未設定'}`);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      addLog('❌ 環境変数が不完全です');
      return false;
    }
    
    addLog('✅ 環境変数は正常に設定されています');
    return true;
  };

  const testDirectSupabaseConnection = async () => {
    addLog('🌐 Supabase直接接続テスト開始...');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      addLog('❌ 環境変数が設定されていません');
      return false;
    }
    
    try {
      // Test REST API endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      addLog(`📡 REST API応答: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        addLog('✅ Supabase REST API接続成功');
      } else {
        addLog(`❌ Supabase REST API接続失敗: ${response.status}`);
      }
      
      // Test auth endpoint
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        }
      });
      
      addLog(`🔐 Auth API応答: ${authResponse.status} ${authResponse.statusText}`);
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        addLog('✅ Supabase Auth API接続成功');
        addLog(`📊 Auth設定: ${JSON.stringify(authData).substring(0, 100)}...`);
      } else {
        addLog(`❌ Supabase Auth API接続失敗: ${authResponse.status}`);
      }
      
      return response.ok && authResponse.ok;
      
    } catch (error: any) {
      addLog(`❌ 接続エラー: ${error.message}`);
      return false;
    }
  };

  const testSupabaseClientInit = async () => {
    addLog('🔧 Supabaseクライアント初期化テスト...');
    
    try {
      const { supabase } = await import('../lib/supabaseClient');
      addLog('✅ Supabaseクライアント初期化成功');
      
      // Test session check
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      addLog(`📊 セッション確認: ${sessionData.session ? 'セッション有り' : 'セッション無し'}`);
      
      if (sessionError) {
        addLog(`⚠️ セッションエラー: ${sessionError.message}`);
      }
      
      return true;
    } catch (error: any) {
      addLog(`❌ クライアント初期化失敗: ${error.message}`);
      return false;
    }
  };

  const testLoginFunctionality = async () => {
    addLog('🔐 ログイン機能テスト開始...');
    
    try {
      const { supabase } = await import('../lib/supabaseClient');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'slazengersnow@gmail.com',
        password: 's45352512'
      });
      
      if (error) {
        addLog(`❌ ログイン失敗: ${error.message}`);
        return false;
      }
      
      addLog(`✅ ログイン成功: ${data.user?.email}`);
      addLog(`📊 アクセストークン: ${data.session?.access_token ? '取得済み' : '未取得'}`);
      
      // Test session persistence
      setTimeout(async () => {
        const { data: checkData } = await supabase.auth.getSession();
        addLog(`📊 セッション持続確認: ${checkData.session ? '持続中' : '失われました'}`);
      }, 1000);
      
      return true;
    } catch (error: any) {
      addLog(`❌ ログインテストエラー: ${error.message}`);
      return false;
    }
  };

  const testAPIRequest = async () => {
    addLog('📡 API リクエストテスト開始...');
    
    try {
      const response = await fetch('/api/progress-report');
      addLog(`📡 API応答: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        addLog(`✅ API呼び出し成功: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        addLog(`❌ API呼び出し失敗: ${response.status}`);
      }
      
      return response.ok;
    } catch (error: any) {
      addLog(`❌ APIリクエストエラー: ${error.message}`);
      return false;
    }
  };

  const runCompleteTest = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    clearLogs();
    addLog('🧪 完全診断テスト開始...');
    
    try {
      addLog('');
      addLog('=== ステップ 1: 環境変数チェック ===');
      const envOk = testEnvironmentVariables();
      
      if (!envOk) {
        addLog('❌ 環境変数の問題により、テストを中止します');
        return;
      }
      
      addLog('');
      addLog('=== ステップ 2: Supabase直接接続テスト ===');
      const connectionOk = await testDirectSupabaseConnection();
      
      addLog('');
      addLog('=== ステップ 3: Supabaseクライアント初期化 ===');
      const clientOk = await testSupabaseClientInit();
      
      addLog('');
      addLog('=== ステップ 4: ログイン機能テスト ===');
      const loginOk = await testLoginFunctionality();
      
      addLog('');
      addLog('=== ステップ 5: API リクエストテスト ===');
      const apiOk = await testAPIRequest();
      
      addLog('');
      addLog('=== 診断結果サマリー ===');
      addLog(`環境変数: ${envOk ? '✅' : '❌'}`);
      addLog(`Supabase接続: ${connectionOk ? '✅' : '❌'}`);
      addLog(`クライアント初期化: ${clientOk ? '✅' : '❌'}`);
      addLog(`ログイン機能: ${loginOk ? '✅' : '❌'}`);
      addLog(`API リクエスト: ${apiOk ? '✅' : '❌'}`);
      
      const allOk = envOk && connectionOk && clientOk && loginOk && apiOk;
      addLog('');
      addLog(`🎯 総合結果: ${allOk ? '✅ 全て正常' : '❌ 問題が検出されました'}`);
      
    } catch (error: any) {
      addLog(`❌ テスト実行エラー: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Supabase接続診断ツール</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={runCompleteTest}
          disabled={isRunning}
          style={{ 
            padding: '12px 24px',
            backgroundColor: isRunning ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isRunning ? '診断実行中...' : '完全診断実行'}
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
            <div style={{ color: '#666' }}>完全診断を実行してください...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>{log}</div>
            ))
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h4>このツールについて:</h4>
        <p>このツールは以下の項目を段階的にテストして、ログイン問題の根本原因を特定します：</p>
        <ul>
          <li><strong>環境変数</strong>: VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY の設定確認</li>
          <li><strong>Supabase接続</strong>: REST API と Auth API への直接接続テスト</li>
          <li><strong>クライアント初期化</strong>: Supabaseクライアントの正常な初期化確認</li>
          <li><strong>ログイン機能</strong>: 実際のログイン処理とセッション作成テスト</li>
          <li><strong>API リクエスト</strong>: 認証後のAPI呼び出し動作確認</li>
        </ul>
        <p><strong>推奨:</strong> まずこの診断を実行して問題箇所を特定してから、具体的な修正を行ってください。</p>
      </div>
    </div>
  );
}