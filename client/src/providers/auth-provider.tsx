import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type AuthCtx = {
  user: any | null;
  initialized: boolean;
  isLoading: boolean;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  initialized: false,
  isLoading: true,
});

export const useAuth = () => {
  const context = useContext(Ctx);
  
  // 開発環境では強制的に認証状態をtrueに
  if (window.location.hostname.includes('replit')) {
    console.log('AuthProvider: REPLIT環境 - 強制認証済み状態');
    return {
      user: { email: 'dev@replit.dev', id: 'dev-user' },
      initialized: true,
      isLoading: false,
      isAuthenticated: true,
    };
  }
  
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let first = true;
    console.log("🔄 AuthProvider: Initializing...");

    // 初期セッション取得
    supabase.auth.getSession().then(({ data, error }) => {
      console.log("🔄 Initial session check:", {
        hasSession: !!data.session,
        hasUser: !!data.session?.user,
        userEmail: data.session?.user?.email,
        error,
      });
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    // 認証状態変更の監視
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔄 Auth state change:", {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
      });

      setUser(session?.user ?? null);
      setIsLoading(false);

      // 重要: 初回のコールバックで初期化完了
      if (first) {
        first = false;
        setInitialized(true);
        console.log("✅ AuthProvider: Initialized after first auth change");
      }

      // セッション永続化（iframe互換性のため）
      if (event === "SIGNED_IN" && session?.user) {
        console.log("🚀 User signed in:", session.user.email);
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            const sessionData = {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              user: session.user,
              expires_at: session.expires_at,
            };
            localStorage.setItem(
              "supabase.auth.token",
              JSON.stringify(sessionData),
            );
            console.log("💾 Session persisted to localStorage");
          }
        } catch (storageError) {
          console.warn("⚠️ Could not persist session:", storageError);
        }
      } else if (event === "SIGNED_OUT") {
        console.log("👋 User signed out");
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.removeItem("supabase.auth.token");
          }
        } catch (storageError) {
          console.warn("⚠️ Could not clear localStorage:", storageError);
        }
      }
    });

    // フォールバック: 800ms後に強制的に初期化完了
    const timeout = setTimeout(() => {
      if (first) {
        first = false;
        setInitialized(true);
        setIsLoading(false);
        console.log("⏰ AuthProvider: Initialized by timeout");
      }
    }, 800);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <Ctx.Provider value={{ user, initialized, isLoading }}>
      {children}
    </Ctx.Provider>
  );
};
