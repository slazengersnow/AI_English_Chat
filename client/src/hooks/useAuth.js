import { useState, useEffect } from 'react';
import { supabase } from '@shared/supabase';
export function useAuthState() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setIsLoading(false);
        };
        getInitialSession();
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);
    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };
    const isAuthenticated = !!user;
    const isAdmin = user?.email === 'slazengersnow@gmail.com';
    return {
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        signOut,
    };
}
