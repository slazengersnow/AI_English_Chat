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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setInitialized(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
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
      isLoading: !initialized,
      isAdmin,
      signOut
    }}>
      {children}
    </Ctx.Provider>
  );
}