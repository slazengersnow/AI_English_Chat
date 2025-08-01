// Replit OAuth設定ユーティリティ
// ReplitのドメインとOAuth設定を適切に処理する

export const getReplitDomainConfig = () => {
  // サーバー側でREPLIT_DEV_DOMAINを取得
  const replitDevDomain = process.env.REPLIT_DEV_DOMAIN || 'ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev';
  const replitDomains = process.env.REPLIT_DOMAINS || replitDevDomain;
  
  return {
    devDomain: replitDevDomain,
    domains: replitDomains,
    isReplit: !!process.env.REPLIT_DEV_DOMAIN,
  };
};

export const getOAuthRedirectURL = (): string => {
  // ブラウザ環境での実行
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    const redirectUrl = `${currentOrigin}/auth/callback`;
    
    console.log('🔧 Replit OAuth設定:', {
      currentOrigin,
      redirectUrl,
      pathname: window.location.pathname,
      hostname: window.location.hostname,
      isReplitDev: currentOrigin.includes('replit.dev'),
      isReplitApp: currentOrigin.includes('replit.app')
    });
    
    return redirectUrl;
  }
  
  // サーバー環境での実行
  const config = getReplitDomainConfig();
  const baseUrl = `https://${config.devDomain}`;
  return `${baseUrl}/auth/callback`;
};

export const createReplitSupabaseClient = async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = 'https://xcjplyhqxgrbdhixmzse.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjanlseXFoeGdyYmRoaXhtenNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNjExMjMsImV4cCI6MjA1MDkzNzEyM30.XZaYqFdXF9XZQEtJGXcvzuXGlhXRoZKOJ4PxzCnJgDo';
    
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Supabaseクライアント作成エラー:', error);
    throw error;
  }
};

export const executeReplitGoogleOAuth = async () => {
  try {
    const supabase = await createReplitSupabaseClient();
    const redirectUrl = getOAuthRedirectURL();
    
    console.log('🚀 Replit Google OAuth実行:', {
      redirectUrl,
      timestamp: new Date().toISOString()
    });
    
    const { data, error } = await supabase.auth.signInWithOAuth({
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
      console.error('❌ Replit Google OAuth エラー:', error);
      throw error;
    }
    
    console.log('✅ Replit Google OAuth 成功:', data);
    return { data, error: null };
    
  } catch (error) {
    console.error('❌ Replit Google OAuth 例外:', error);
    return { data: null, error };
  }
};