"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuthState = useAuthState;
const react_1 = require("react");
const supabase_1 = require("@shared/supabase");
function useAuthState() {
    const [user, setUser] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        // Get initial session
        const getInitialSession = async () => {
            const { data: { session } } = await supabase_1.supabase.auth.getSession();
            setUser(session?.user ?? null);
            setIsLoading(false);
        };
        getInitialSession();
        // Listen for auth changes
        const { data: { subscription } } = supabase_1.supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);
    const signOut = async () => {
        await supabase_1.supabase.auth.signOut();
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
