import React from 'react';

// 緊急デモログイン - Agent-Preview同期問題回避用
const EmergencyDemoLogin = () => {
  const activateDemo = () => {
    // 管理者アカウントでの自動ログイン実行
    console.log('=== EMERGENCY DEMO ACTIVATION ===');
    
    // ローカルストレージに認証情報を強制設定
    localStorage.setItem('demo_mode', 'active');
    localStorage.setItem('auth_bypass', 'true');
    localStorage.setItem('user_email', 'admin.new@gmail.com');
    localStorage.setItem('user_role', 'admin');
    
    // 認証状態をSessionStorageに設定
    sessionStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'demo_token',
      refresh_token: 'demo_refresh',
      user: {
        id: 'demo_admin_id',
        email: 'admin.new@gmail.com',
        role: 'authenticated'
      }
    }));
    
    // 強制リダイレクト
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  };

  const goToDirectDemo = () => {
    window.location.href = '/auto-demo';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#f0f2f5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '24px',
          marginBottom: '16px',
          color: '#1a1a1a'
        }}>
          🚨 緊急デモアクセス
        </h1>
        
        <p style={{
          color: '#666',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          Agent-Preview同期問題により、通常のログインが機能しない場合の緊急アクセス方法です。
        </p>
        
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={activateDemo}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            デモモード強制起動
          </button>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={goToDirectDemo}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            自動デモページへ
          </button>
        </div>
        
        <div style={{
          fontSize: '14px',
          color: '#888',
          marginTop: '20px'
        }}>
          <p>認証情報: admin.new@gmail.com</p>
          <p>パスワード: s05936623</p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyDemoLogin;