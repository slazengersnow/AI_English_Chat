import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../providers/auth-provider";

export default function SessionDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);
  const auth = useAuth();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  const testSessionPersistence = async () => {
    setLogs([]);
    addLog('🧪 Testing session persistence...');

    try {
      // Check Supabase session
      const { data: supabaseData } = await supabase.auth.getSession();
      addLog(`📊 Supabase session: ${supabaseData.session ? 'Found' : 'None'}`);
      addLog(`📊 Supabase user: ${supabaseData.session?.user?.email || 'None'}`);
      addLog(`📊 Supabase token: ${supabaseData.session?.access_token ? 'Present' : 'Missing'}`);

      // Check localStorage backup
      let localStorageInfo = 'None';
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('supabase.auth.token');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            localStorageInfo = `User: ${parsed.user?.email || 'Unknown'}, Token: ${parsed.access_token ? 'Present' : 'Missing'}`;
          } catch (e) {
            localStorageInfo = 'Corrupted data';
          }
        }
      }
      addLog(`📊 localStorage backup: ${localStorageInfo}`);

      // Check AuthProvider state
      addLog(`📊 AuthProvider user: ${auth.user?.email || 'None'}`);
      addLog(`📊 AuthProvider initialized: ${auth.initialized}`);

      // Test API call
      addLog('📡 Testing API call with current auth...');
      try {
        const response = await fetch('/api/progress-report');
        addLog(`📡 API response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          addLog(`✅ API call successful: ${JSON.stringify(data).substring(0, 100)}...`);
        } else {
          addLog(`❌ API call failed: ${response.status}`);
        }
      } catch (apiError: any) {
        addLog(`❌ API call error: ${apiError.message}`);
      }

      // Update debug info
      setDebugInfo({
        supabaseSession: supabaseData.session,
        localStorage: localStorageInfo,
        authProvider: auth,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      addLog(`❌ Session test failed: ${error.message}`);
    }
  };

  const clearAllSessions = async () => {
    addLog('🗑️ Clearing all sessions...');
    
    // Clear Supabase
    await supabase.auth.signOut();
    addLog('🗑️ Supabase session cleared');
    
    // Clear localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('supabase.auth.token');
      addLog('🗑️ localStorage cleared');
    }
    
    // Refresh page
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const forceLogin = async () => {
    addLog('🔐 Attempting force login...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'slazengersnow@gmail.com',
        password: 's45352512'
      });

      if (error) {
        addLog(`❌ Login failed: ${error.message}`);
      } else {
        addLog(`✅ Login successful: ${data.user?.email}`);
        
        // Wait a bit then test persistence
        setTimeout(() => {
          testSessionPersistence();
        }, 1000);
      }
    } catch (error: any) {
      addLog(`❌ Login error: ${error.message}`);
    }
  };

  useEffect(() => {
    testSessionPersistence();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>セッション永続化デバッグ</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={testSessionPersistence}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          セッション状態チェック
        </button>
        
        <button 
          onClick={forceLogin}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          強制ログイン
        </button>
        
        <button 
          onClick={clearAllSessions}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          全セッションクリア
        </button>
      </div>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '15px'
        }}>
          <h3 style={{ marginTop: '0' }}>現在の状態</h3>
          <pre style={{ 
            backgroundColor: '#e9ecef', 
            padding: '10px', 
            borderRadius: '4px', 
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '15px'
        }}>
          <h3 style={{ marginTop: '0' }}>デバッグログ</h3>
          <div style={{ 
            backgroundColor: '#1e1e1e', 
            color: '#00ff00', 
            padding: '15px', 
            borderRadius: '4px', 
            fontFamily: 'Monaco, Consolas, monospace',
            fontSize: '12px',
            maxHeight: '300px', 
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#666' }}>ログなし...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
        <h4>診断手順:</h4>
        <ol>
          <li>「セッション状態チェック」で現在の認証状態を確認</li>
          <li>「強制ログイン」でログインしてセッションを作成</li>
          <li>ページをリフレッシュしてセッションが維持されるか確認</li>
          <li>問題がある場合は「全セッションクリア」してリセット</li>
        </ol>
      </div>
    </div>
  );
}