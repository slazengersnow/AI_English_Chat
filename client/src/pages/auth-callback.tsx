import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const [msg, setMsg] = useState("認証処理中...");

  useEffect(() => {
    (async () => {
      try {
        console.log('Auth callback: Starting processing...');
        const p = new URLSearchParams(window.location.search);
        const code = p.get("code");
        
        console.log('Auth callback: URL params:', {
          code: code ? 'present' : 'missing',
          fullUrl: window.location.href
        });
        
        if (code) {
          console.log('Auth callback: Exchanging code for session...');
          const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
          
          console.log('Auth callback: Exchange result:', {
            session: sessionData?.session,
            user: sessionData?.user,
            error
          });
          
          if (error) {
            console.error('Auth callback: Exchange error:', error);
            throw error;
          }
        }
        
        // セッション確認
        console.log('Auth callback: Checking session...');
        const { data } = await supabase.auth.getSession();
        
        console.log('Auth callback: Current session:', {
          hasSession: !!data.session,
          hasUser: !!data.session?.user,
          userEmail: data.session?.user?.email
        });
        
        if (data.session) {
          setMsg("認証完了！プラン選択画面に移動します...");
          setTimeout(() => {
            window.location.replace("/subscription-select");
          }, 1000);
          return;
        }
        
        setMsg("認証リンクが無効または期限切れです。もう一度お試しください。");
      } catch (e: any) {
        console.error('Auth callback: Error:', e);
        setMsg(`認証エラー: ${e.message || e}`);
      }
    })();
  }, []);

  return <div style={{padding:24}}>{msg}</div>;
}