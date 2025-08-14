// client/src/providers/auth-provider.tsx
import { supabase } from "@/lib/supabaseClient";
import { createContext, useContext, useEffect, useState } from "react";

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
  const [user, setUser] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Starting initialization...');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Session error:', error);
        } else {
          console.log('AuthProvider: Initial session:', { 
            hasSession: !!session, 
            hasUser: !!session?.user,
            userEmail: session?.user?.email 
          });
        }
        
        if (mounted) {
          setUser(session?.user ?? null);
          setInitialized(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('AuthProvider: Initialization error:', error);
        if (mounted) {
          setInitialized(true);
          setIsLoading(false);
        }
      }
    };
    
    initializeAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state change:', { 
          event, 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userEmail: session?.user?.email 
        });
        
        if (mounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      }
    );
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
      isLoading,
      isAdmin,
      signOut
    }}>
      {children}
    </Ctx.Provider>
  );
}