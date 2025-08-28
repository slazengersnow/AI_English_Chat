import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const [msg, setMsg] = useState("認証処理中...");

  useEffect(() => {
    (async () => {
      try {
        // URLからパラメータを取得
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // HashベースとQueryベースの両方をチェック
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const code = searchParams.get('code');
        
        // アクセストークンが直接取得できる場合（ハッシュ認証）
        if (accessToken) {
          console.log("🔑 Direct access token found, setting session");
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) throw error;
          
          if (data.session) {
            console.log("✅ Session set successfully");
            
            // 管理者アカウントの場合はメインページに遷移
            if (data.session.user?.email === 'slazengersnow@gmail.com') {
              console.log("🔑 Admin user detected, redirecting to main page");
              setMsg("管理者として認証されました。メインページに移動します...");
              setTimeout(() => {
                window.location.href = "/";
              }, 1000);
              return;
            }
            
            setMsg("認証が完了しました。料金プランの選択画面に移動します...");
            setTimeout(() => {
              window.location.href = "/subscription-select";
            }, 1000);
            return;
          }
        }
        
        // 認証コードがある場合（PKCE認証）
        if (code) {
          console.log("🔐 Authorization code found, exchanging for session");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("❌ Code exchange error:", error);
            throw error;
          }
          
          if (data.session) {
            console.log("✅ Code exchange successful");
            
            // 管理者アカウントの場合はメインページに遷移
            if (data.session.user?.email === 'slazengersnow@gmail.com') {
              console.log("🔑 Admin user detected, redirecting to main page");
              setMsg("管理者として認証されました。メインページに移動します...");
              setTimeout(() => {
                window.location.href = "/";
              }, 1000);
              return;
            }
            
            setMsg("認証が完了しました。料金プランの選択画面に移動します...");
            setTimeout(() => {
              window.location.href = "/subscription-select";
            }, 1000);
            return;
          }
        }
        
        // 既存のセッションをチェック
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          console.log("✅ Existing session found");
          
          // 管理者アカウントの場合はメインページに遷移
          if (sessionData.session.user?.email === 'slazengersnow@gmail.com') {
            console.log("🔑 Admin user detected, redirecting to main page");
            setMsg("管理者として認証されました。メインページに移動します...");
            setTimeout(() => {
              window.location.href = "/";
            }, 1000);
            return;
          }
          
          setMsg("認証が完了しました。料金プランの選択画面に移動します...");
          setTimeout(() => {
            window.location.href = "/subscription-select";
          }, 1000);
          return;
        }
        
        console.warn("⚠️ No valid authentication data found");
        setMsg("認証リンクが無効または期限切れです。もう一度お試しください。");
      } catch (e: any) {
        console.error("❌ Auth callback error:", e);
        setMsg(`認証エラー: ${e.message || e}`);
      }
    })();
  }, []);

  return <div style={{padding:24}}>{msg}</div>;
}