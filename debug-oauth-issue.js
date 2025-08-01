// OAuth問題の根本原因調査と修正

console.log('🔍 OAuth問題の詳細調査開始');

// 1. 現在の環境詳細を確認
const environmentCheck = () => {
  const details = {
    currentURL: window.location.href,
    origin: window.location.origin,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    port: window.location.port,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    
    // User Agent
    userAgent: navigator.userAgent,
    
    // Supabase config
    supabaseAvailable: !!window.supabase,
    
    // Storage状態
    localStorage: Object.keys(localStorage),
    sessionStorage: Object.keys(sessionStorage)
  };
  
  console.log('📊 環境詳細:', details);
  return details;
};

// 2. OAuthリダイレクトURLが間違っている理由を特定
const identifyRedirectIssue = () => {
  const current = window.location.origin;
  const wrong = 'https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app';
  
  console.log('🚨 リダイレクトURL問題:');
  console.log('  正しいURL:', current + '/auth/callback');
  console.log('  間違ったURL:', wrong + '/auth/callback');
  console.log('  違い:', current !== wrong.replace('.replit.app', '-00-1cp40i68ggx3z.kirk.replit.dev'));
  
  // Supabaseクライアントの設定確認
  if (window.supabase) {
    console.log('✅ Supabaseクライアント利用可能');
  } else {
    console.log('❌ Supabaseクライアントが利用できません');
  }
};

// 3. 強制的にOAuthを正しいURLで実行
const forceCorrectOAuth = async () => {
  try {
    if (!window.supabase) {
      console.error('❌ Supabaseが利用できません');
      return;
    }
    
    const correctRedirectUrl = window.location.origin + '/auth/callback';
    console.log('🔧 強制修正でOAuth実行:', correctRedirectUrl);
    
    const { data, error } = await window.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: correctRedirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) {
      console.error('❌ OAuth失敗:', error);
    } else {
      console.log('✅ OAuth成功:', data);
    }
    
    return { data, error };
  } catch (e) {
    console.error('❌ OAuth例外:', e);
    return { data: null, error: e };
  }
};

// 4. 代替認証方法
const alternativeAuth = async () => {
  console.log('🔄 代替認証方法を試行');
  
  // 管理者アカウントでの直接ログイン
  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email: 'admin.new@gmail.com',
      password: 's05936623',
    });
    
    if (error) {
      console.error('❌ 直接ログイン失敗:', error);
    } else {
      console.log('✅ 直接ログイン成功:', data);
      localStorage.setItem('auth_method', 'direct_login');
      localStorage.setItem('user_email', 'admin.new@gmail.com');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  } catch (e) {
    console.error('❌ 直接ログイン例外:', e);
  }
};

// 実行
environmentCheck();
identifyRedirectIssue();

// グローバル関数として公開
window.forceCorrectOAuth = forceCorrectOAuth;
window.alternativeAuth = alternativeAuth;

console.log('🔧 デバッグ完了');
console.log('📞 実行方法:');
console.log('  window.forceCorrectOAuth() - 修正されたOAuth');
console.log('  window.alternativeAuth() - 代替ログイン');