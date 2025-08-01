// Google OAuth修正スクリプト
console.log('=== Google OAuth修正開始 ===');

// 1. Supabase OAuth設定の確認
const checkSupabaseConfig = () => {
  const config = {
    url: window.location.origin,
    supabaseUrl: import.meta?.env?.VITE_SUPABASE_URL || 'default',
    hasAnonymousKey: !!(import.meta?.env?.VITE_SUPABASE_ANON_KEY),
    currentDomain: window.location.origin,
    redirectPath: '/auth/callback'
  };
  
  console.log('📊 Supabase OAuth設定:', config);
  return config;
};

// 2. OAuth リダイレクトURLの動的設定
const fixOAuthRedirect = () => {
  // 現在のドメインを使用してリダイレクトURLを修正
  const currentDomain = window.location.origin;
  const correctRedirectUrl = `${currentDomain}/auth/callback`;
  
  console.log('🔧 正しいリダイレクトURL:', correctRedirectUrl);
  
  // グローバルに設定して他のコンポーネントからアクセス可能にする
  window.OAUTH_REDIRECT_URL = correctRedirectUrl;
  
  return correctRedirectUrl;
};

// 3. Google OAuth認証の再実行
const retryGoogleAuth = async () => {
  try {
    if (!window.supabase) {
      console.error('❌ Supabaseクライアントが利用できません');
      return;
    }
    
    const redirectUrl = fixOAuthRedirect();
    
    const { data, error } = await window.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) {
      console.error('❌ Google OAuth エラー:', error);
    } else {
      console.log('✅ Google OAuth 開始成功:', data);
    }
    
    return { data, error };
  } catch (e) {
    console.error('❌ OAuth例外:', e);
    return { data: null, error: e };
  }
};

// 4. OAuth コールバック処理の改善
const handleOAuthCallback = async () => {
  try {
    const { data, error } = await window.supabase.auth.getSession();
    
    if (error) {
      console.error('❌ セッション取得エラー:', error);
      return false;
    }
    
    if (data.session) {
      console.log('✅ OAuth認証成功:', data.session.user.email);
      localStorage.setItem('oauth_success', 'true');
      localStorage.setItem('user_email', data.session.user.email);
      
      // ホームページにリダイレクト
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('❌ コールバック処理エラー:', e);
    return false;
  }
};

// 実行
checkSupabaseConfig();
fixOAuthRedirect();

// グローバル関数として公開
window.retryGoogleAuth = retryGoogleAuth;
window.handleOAuthCallback = handleOAuthCallback;

console.log('✅ Google OAuth修正完了');
console.log('使用方法: window.retryGoogleAuth() でGoogle認証を再試行');