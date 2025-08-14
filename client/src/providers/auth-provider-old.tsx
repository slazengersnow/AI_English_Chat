// client/src/providers/auth-provider.tsx
import { supabase } from "@/lib/supabaseClient";
import { createContext, useContext, useEffect, useRef, useState } from "react";

type AuthCtx = { 
  user: any; 
  initialized: boolean; 
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin?: boolean;
  signOut?: () => Promise<void>;
};
const Ctx = createContext<AuthCtx>({ 
  user: null, 
  initialized: false, 
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  signOut: async () => {}
});
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [initialized, setInitialized] = useState(false);
  const gotSessionOnce = useRef(false);
  const gotAuthEventOnce = useRef(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      // 1) 再読み込み時のセッション復元
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      gotSessionOnce.current = true;
      if (gotSessionOnce.current && gotAuthEventOnce.current) setInitialized(true);

      // 2) ランタイムの変化をフォロー
      const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
        setUser(session?.user ?? null);
        gotAuthEventOnce.current = true;
        if (gotSessionOnce.current && gotAuthEventOnce.current) setInitialized(true);
      });
      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => { if (unsub) unsub(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const isAdmin = user?.email === 'slazengersnow@gmail.com';

  return (
    <Ctx.Provider value={{ 
      user, 
      initialized, 
      isAuthenticated: !!user,
      isLoading: false, // Simplified loading state
      isAdmin,
      signOut
    }}>
      {children}
    </Ctx.Provider>
  );
}