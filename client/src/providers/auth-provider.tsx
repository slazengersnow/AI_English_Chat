import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type AuthCtx = { user: any | null; initialized: boolean; };
const Ctx = createContext<AuthCtx>({ user: null, initialized: false });
export const useAuth = () => useContext(Ctx);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [initialized, setInitialized] = useState(false);
  const gotSessionOnce = useRef(false);
  const gotAuthEventOnce = useRef(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      gotSessionOnce.current = true;
      if (gotSessionOnce.current && gotAuthEventOnce.current) setInitialized(true);

      const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
        setUser(session?.user ?? null);
        gotAuthEventOnce.current = true;
        if (gotSessionOnce.current && gotAuthEventOnce.current) setInitialized(true);
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  return <Ctx.Provider value={{ user, initialized }}>{children}</Ctx.Provider>;
};