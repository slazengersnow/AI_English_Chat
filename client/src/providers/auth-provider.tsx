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
      console.log('🔄 AuthProvider: Initializing with session persistence...');
      
      try {
        // Try to restore from localStorage first for iframe compatibility
        let restoredFromStorage = false;
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const storedSession = localStorage.getItem('supabase.auth.token');
            if (storedSession) {
              const parsedSession = JSON.parse(storedSession);
              if (parsedSession.user && parsedSession.access_token) {
                console.log('🔄 Restoring session from localStorage:', parsedSession.user.email);
                // Set the session in Supabase
                const { data, error } = await supabase.auth.setSession({
                  access_token: parsedSession.access_token,
                  refresh_token: parsedSession.refresh_token
                });
                if (data.session?.user) {
                  setUser(data.session.user);
                  restoredFromStorage = true;
                  console.log('✅ Session restored successfully from localStorage');
                }
              }
            }
          } catch (restoreError) {
            console.warn('⚠️ Could not restore session from localStorage:', restoreError);
            localStorage.removeItem('supabase.auth.token');
          }
        }
        
        // Get current session if not restored
        if (!restoredFromStorage) {
          const { data, error } = await supabase.auth.getSession();
          console.log('🔄 AuthProvider: Getting current session:', { 
            hasSession: !!data.session, 
            hasUser: !!data.session?.user,
            userEmail: data.session?.user?.email,
            error 
          });
          
          setUser(data.session?.user ?? null);
        }
        
        gotSessionOnce.current = true;
        if (gotSessionOnce.current && gotAuthEventOnce.current) {
          setInitialized(true);
          console.log('✅ AuthProvider: Fully initialized');
        }

        // Listen for auth state changes
        const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔄 AuthProvider: Auth state change:', { 
            event, 
            hasSession: !!session, 
            hasUser: !!session?.user,
            userEmail: session?.user?.email 
          });
          
          setUser(session?.user ?? null);
          gotAuthEventOnce.current = true;
          
          // Handle session persistence
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('🚀 User signed in successfully:', session.user.email);
            
            // Force localStorage persistence for iframe compatibility
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                const sessionData = {
                  access_token: session.access_token,
                  refresh_token: session.refresh_token,
                  user: session.user,
                  expires_at: session.expires_at
                };
                localStorage.setItem('supabase.auth.token', JSON.stringify(sessionData));
                console.log('💾 Session persisted to localStorage for iframe compatibility');
              }
            } catch (storageError) {
              console.warn('⚠️ Could not persist session to localStorage:', storageError);
            }
            
            // Redirect after successful login
            setTimeout(() => {
              const currentPath = window.location.pathname;
              if (currentPath === '/login' || currentPath.includes('auth-test') || currentPath === '/signup-simple') {
                console.log('🚀 Redirecting to home page after successful login');
                window.location.href = '/';
              }
            }, 1000);
            
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out');
            // Clear localStorage
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem('supabase.auth.token');
                console.log('🗑️ Session cleared from localStorage');
              }
            } catch (storageError) {
              console.warn('⚠️ Could not clear localStorage:', storageError);
            }
          } else if (event === 'TOKEN_REFRESHED' && session) {
            console.log('🔄 Token refreshed successfully');
            // Update localStorage with new token
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                const sessionData = {
                  access_token: session.access_token,
                  refresh_token: session.refresh_token,
                  user: session.user,
                  expires_at: session.expires_at
                };
                localStorage.setItem('supabase.auth.token', JSON.stringify(sessionData));
                console.log('💾 Refreshed session persisted to localStorage');
              }
            } catch (storageError) {
              console.warn('⚠️ Could not update localStorage:', storageError);
            }
          }
          
          if (gotSessionOnce.current && gotAuthEventOnce.current) {
            setInitialized(true);
            console.log('✅ AuthProvider: Fully initialized after auth change');
          }
        });
        
        unsub = () => sub.subscription.unsubscribe();
        
        // Set initialized if we haven't already
        if (gotSessionOnce.current) {
          setInitialized(true);
          console.log('✅ AuthProvider: Initialization complete');
        }
        
      } catch (initError) {
        console.error('❌ AuthProvider initialization failed:', initError);
        setInitialized(true); // Prevent infinite loading
      }
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  return <Ctx.Provider value={{ user, initialized }}>{children}</Ctx.Provider>;
};