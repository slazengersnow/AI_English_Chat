import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function EmergencyFix() {
  const [logs, setLogs] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  const testDirectLogin = async () => {
    setLoading(true);
    addLog('🔐 Direct Supabase login test...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'slazengersnow@gmail.com',
        password: 's45352512'
      });

      if (error) {
        addLog(`❌ Login failed: ${error.message}`);
        return;
      }

      if (data.user && data.session) {
        addLog(`✅ Login successful: ${data.user.email}`);
        setUser(data.user);
        
        // Store in multiple places for reliability
        try {
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            user: data.user
          }));
          localStorage.setItem('emergency_user', JSON.stringify(data.user));
          addLog('💾 Session stored in localStorage');
        } catch (storageError) {
          addLog(`⚠️ Storage error: ${storageError}`);
        }
        
        // Test if we can access API endpoints now
        setTimeout(() => testAPIAccess(), 1000);
      }
    } catch (error: any) {
      addLog(`❌ Login exception: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAPIAccess = async () => {
    addLog('📡 Testing API access...');
    
    const testEndpoints = ['/api/health', '/api/progress-report', '/api/recent-sessions'];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(endpoint, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          addLog(`✅ ${endpoint}: SUCCESS (${response.status})`);
        } else {
          addLog(`❌ ${endpoint}: FAILED (${response.status})`);
        }
      } catch (fetchError: any) {
        addLog(`❌ ${endpoint}: NETWORK ERROR - ${fetchError.message}`);
      }
    }
  };

  const bypassToMainApp = () => {
    if (user) {
      addLog('🚀 Bypassing to main app...');
      
      // Set emergency user data
      window.localStorage.setItem('emergency_auth_bypass', 'true');
      window.localStorage.setItem('emergency_user', JSON.stringify(user));
      
      // Redirect to main app
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } else {
      addLog('❌ No user logged in - cannot bypass');
    }
  };

  const testRealtimeConnection = async () => {
    addLog('🔌 Testing realtime connection...');
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const wsUrl = supabaseUrl?.replace('https://', 'wss://') + '/realtime/v1/websocket';
      
      const testWs = new WebSocket(wsUrl + '?apikey=' + import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      testWs.onopen = () => {
        addLog('✅ Realtime WebSocket: Connected');
        testWs.close();
      };
      
      testWs.onerror = () => {
        addLog('❌ Realtime WebSocket: Connection failed');
      };
      
      testWs.onclose = () => {
        addLog('🔌 Realtime WebSocket: Closed');
      };
      
    } catch (error: any) {
      addLog(`❌ Realtime test error: ${error.message}`);
    }
  };

  const runFullDiagnostic = async () => {
    setLogs([]);
    addLog('🧪 Running full diagnostic...');
    
    // Test 1: Environment check
    addLog('=== Environment Check ===');
    addLog(`VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}`);
    addLog(`VITE_SUPABASE_ANON_KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}`);
    addLog(`Window location: ${window.location.href}`);
    addLog(`In iframe: ${window !== window.top ? 'Yes' : 'No'}`);
    
    // Test 2: Basic fetch test
    addLog('=== Basic Fetch Test ===');
    try {
      const response = await fetch('/api/health');
      addLog(`Health check: ${response.status} ${response.statusText}`);
    } catch (error: any) {
      addLog(`Health check failed: ${error.message}`);
    }
    
    // Test 3: Login test
    addLog('=== Login Test ===');
    await testDirectLogin();
    
    // Test 4: Realtime test
    addLog('=== Realtime Test ===');
    await testRealtimeConnection();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>緊急ログイン修復ツール</h1>
      <p>フェッチエラーと認証問題の緊急対応ツールです。</p>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={runFullDiagnostic}
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
          完全診断実行
        </button>
        
        <button 
          onClick={testDirectLogin}
          disabled={loading}
          style={{ 
            padding: '12px 24px',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          直接ログインテスト
        </button>
        
        {user && (
          <button 
            onClick={bypassToMainApp}
            style={{ 
              padding: '12px 24px',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            メインアプリにバイパス
          </button>
        )}
        
        <button 
          onClick={() => setLogs([])}
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

      {user && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb', 
          borderRadius: '4px' 
        }}>
          <h4>ログイン成功!</h4>
          <p>ユーザー: {user.email}</p>
          <p>ID: {user.id}</p>
        </div>
      )}

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
          maxHeight: '400px', 
          overflowY: 'auto',
          whiteSpace: 'pre-wrap'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#666' }}>診断を実行してください...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>{log}</div>
            ))
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
        <h4>このツールについて:</h4>
        <p>Replitのiframe環境での"Failed to fetch"エラーに対応するための緊急修復ツールです。</p>
        <ul>
          <li><strong>完全診断</strong>: 環境・ネットワーク・認証・WebSocketの包括的テスト</li>
          <li><strong>直接ログイン</strong>: Supabaseに直接ログインして認証状態を確立</li>
          <li><strong>バイパス機能</strong>: API接続問題を回避してメインアプリにアクセス</li>
        </ul>
        <p><strong>使用方法</strong>: まず「完全診断実行」で問題を特定し、「直接ログインテスト」で認証を確立してから「メインアプリにバイパス」でアクセスしてください。</p>
      </div>
    </div>
  );
}