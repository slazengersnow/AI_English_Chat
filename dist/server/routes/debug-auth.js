import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xcjplyhqxgrbdhixmzse.supabase.co';
console.log('Debug - Server Supabase URL:', supabaseUrl);
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjanlseXFoeGdyYmRoaXhtenNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNjExMjMsImV4cCI6MjA1MDkzNzEyM30.XZaYqFdXF9XZQEtJGXcvzuXGlhXRoZKOJ4PxzCnJgDo";
// Create admin client (if service key is available)
const adminClient = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;
// Regular client for testing auth
const supabase = createClient(supabaseUrl, supabaseAnonKey);
export async function testAuth(req, res) {
    try {
        const { email, password } = req.body;
        console.log('Testing auth for:', email);
        // Test login with provided credentials
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) {
            console.error('Auth error:', error);
            return res.json({
                success: false,
                error: error.message,
                details: error
            });
        }
        console.log('Auth success:', data.user?.email);
        // Try to get user info if admin client available
        let userInfo = null;
        if (adminClient && data.user) {
            try {
                const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(data.user.id);
                if (!userError) {
                    userInfo = userData.user;
                }
            }
            catch (e) {
                console.log('Admin client not available or user lookup failed');
            }
        }
        res.json({
            success: true,
            user: {
                id: data.user?.id,
                email: data.user?.email,
                emailConfirmed: data.user?.email_confirmed_at,
                createdAt: data.user?.created_at,
                lastSignIn: data.user?.last_sign_in_at
            },
            session: {
                accessToken: data.session?.access_token ? 'present' : 'missing',
                refreshToken: data.session?.refresh_token ? 'present' : 'missing',
                expiresAt: data.session?.expires_at
            },
            adminInfo: userInfo
        });
    }
    catch (error) {
        console.error('Test auth error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
export async function getSupabaseStatus(req, res) {
    res.json({
        supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasAnonKey: !!supabaseAnonKey,
        anonKeyLength: supabaseAnonKey?.length,
        environment: process.env.NODE_ENV || 'development'
    });
}
