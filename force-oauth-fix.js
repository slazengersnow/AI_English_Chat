// 強制的にOAuth問題を修正するスクリプト

console.log('🔧 強制OAuth修正開始');

// 1. ブラウザでSupabaseクライアントを直接再作成
const createFixedSupabaseClient = async () => {
  try {
    // 元のSupabaseインポートをバイパスして新しいクライアントを作成
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = 'https://xcjplyhqxgrbdhixmzse.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjanlseXFoeGdyYmRoaXhtenNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNjExMjMsImV4cCI6MjA1MDkzNzEyM30.XZaYqFdXF9XZQEtJGXcvzuXGlhXRoZKOJ4PxzCnJgDo';
    
    const fixedClient = createClient(supabaseUrl, supabaseKey);
    
    console.log('✅ 修正されたSupabaseクライアントを作成');
    return fixedClient;
  } catch (e) {
    console.error('❌ Supabaseクライアント作成失敗:', e);
    return null;
  }
};

// 2. 正しいリダイレクトURLでGoogle OAuthを実行
const executeCorrectOAuth = async () => {
  const fixedClient = await createFixedSupabaseClient();
  
  if (!fixedClient) {
    console.error('❌ Supabaseクライアントが利用できません');
    return;
  }
  
  const correctRedirectUrl = window.location.origin + '/auth/callback';
  console.log('🎯 正しいリダイレクトURL:', correctRedirectUrl);
  console.log('🚫 間違ったURL:', 'https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app/auth/callback');
  
  try {
    const { data, error } = await fixedClient.auth.signInWithOAuth({
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
      console.error('❌ 修正OAuth失敗:', error);
    } else {
      console.log('✅ 修正OAuth成功:', data);
      console.log('📍 リダイレクト先:', data.url);
    }
    
    return { data, error };
  } catch (e) {
    console.error('❌ OAuth例外:', e);
    return { data: null, error: e };
  }
};

// 3. 代替認証として直接ログインも提供
const directAdminLogin = async () => {
  const fixedClient = await createFixedSupabaseClient();
  
  if (!fixedClient) {
    console.error('❌ Supabaseクライアントが利用できません');
    return;
  }
  
  try {
    const { data, error } = await fixedClient.auth.signInWithPassword({
      email: 'admin.new@gmail.com',
      password: 's05936623',
    });
    
    if (error) {
      console.error('❌ 直接ログイン失敗:', error);
    } else {
      console.log('✅ 直接ログイン成功:', data);
      localStorage.setItem('auth_method', 'direct_admin');
      localStorage.setItem('user_email', 'admin.new@gmail.com');
      
      // ページリロードして認証状態を反映
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
    
    return { data, error };
  } catch (e) {
    console.error('❌ 直接ログイン例外:', e);
    return { data: null, error: e };
  }
};

// グローバル関数として公開
window.executeCorrectOAuth = executeCorrectOAuth;
window.directAdminLogin = directAdminLogin;

console.log('🔧 OAuth修正スクリプト準備完了');
console.log('📞 使用方法:');
console.log('  window.executeCorrectOAuth() - 修正されたGoogle OAuth');
console.log('  window.directAdminLogin() - 管理者直接ログイン');

// 自動実行オプション
if (window.location.pathname === '/login') {
  console.log('🤖 ログインページで自動修正を提案');
  console.log('💡 executeCorrectOAuth() でGoogle認証を修正できます');
}