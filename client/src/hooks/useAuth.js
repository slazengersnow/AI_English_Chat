import { useState, useEffect } from 'react';
import { supabase } from '@shared/supabase';
export function useAuthState() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [demoMode, setDemoMode] = useState(false);
    
    useEffect(() => {
        // Check for demo mode from localStorage
        const isDemoMode = localStorage.getItem('demoMode') === 'true';
        setDemoMode(isDemoMode);
        
        if (isDemoMode) {
            // Create mock admin user for demo
            const mockUser = {
                id: 'demo-admin-id',
                email: 'slazengersnow@gmail.com',
                email_confirmed_at: new Date().toISOString(),
                user_metadata: { role: 'admin', is_admin: true }
            };
            setUser(mockUser);
            setIsLoading(false);
            return;
        }
        
        // Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Auth session error:', error);
                setUser(null);
            }
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
        if (demoMode) {
            localStorage.removeItem('demoMode');
            setUser(null);
            setDemoMode(false);
            return;
        }
        await supabase.auth.signOut();
        setUser(null);
    };
    
    const enableDemoMode = () => {
        localStorage.setItem('demoMode', 'true');
        setDemoMode(true);
        const mockUser = {
            id: 'demo-admin-id',
            email: 'slazengersnow@gmail.com',
            email_confirmed_at: new Date().toISOString(),
            user_metadata: { role: 'admin', is_admin: true }
        };
        setUser(mockUser);
    };
    
    const isAuthenticated = !!user;
    const isAdmin = user?.email === 'slazengersnow@gmail.com' || demoMode;
    
    return {
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        demoMode,
        signOut,
        enableDemoMode,
    };
}
