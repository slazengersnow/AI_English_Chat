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
      console.log('🔄 AuthProvider: Initializing...');
      
      // Get initial session
      const { data, error } = await supabase.auth.getSession();
      console.log('🔄 AuthProvider: Initial session:', { 
        hasSession: !!data.session, 
        hasUser: !!data.session?.user,
        userEmail: data.session?.user?.email,
        error 
      });
      
      setUser(data.session?.user ?? null);
      gotSessionOnce.current = true;
      if (gotSessionOnce.current && gotAuthEventOnce.current) {
        setInitialized(true);
        console.log('✅ AuthProvider: Fully initialized');
      }

      // Listen for auth state changes
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 AuthProvider: Auth state change:', { 
          event, 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userEmail: session?.user?.email 
        });
        
        setUser(session?.user ?? null);
        gotAuthEventOnce.current = true;
        if (gotSessionOnce.current && gotAuthEventOnce.current) {
          setInitialized(true);
          console.log('✅ AuthProvider: Fully initialized after auth change');
        }
        
        // Handle iframe redirects for successful login
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🚀 User signed in successfully, checking redirect...');
          // Small delay to ensure state is updated
          setTimeout(() => {
            if (window.location.pathname === '/login' || window.location.pathname === '/simple-auth-test') {
              console.log('🚀 Redirecting to home page after successful login');
              window.location.href = '/';
            }
          }, 500);
        }
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  return <Ctx.Provider value={{ user, initialized }}>{children}</Ctx.Provider>;
};