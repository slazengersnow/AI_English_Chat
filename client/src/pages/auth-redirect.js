import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useLocation } from 'wouter';
export default function AuthRedirect() {
    const [, setLocation] = useLocation();
    useEffect(() => {
        const processAuthRedirect = () => {
            const hash = window.location.hash;
            const url = window.location.href;
            console.log('AuthRedirect - Processing URL:', url);
            console.log('AuthRedirect - Hash:', hash);
            if (!hash) {
                console.log('AuthRedirect - No hash found, redirecting to login');
                setLocation('/login');
                return;
            }
            // Parse hash parameters
            const params = new URLSearchParams(hash.substring(1));
            const type = params.get('type');
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            console.log('AuthRedirect - Parsed params:', {
                type,
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken
            });
            if (type === 'recovery' && accessToken && refreshToken) {
                console.log('AuthRedirect - Password recovery detected');
                // Store tokens for reset-password page
                sessionStorage.setItem('supabase_recovery_hash', hash);
                setLocation('/reset-password');
            }
            else if (type === 'signup' && accessToken && refreshToken) {
                console.log('AuthRedirect - Signup confirmation detected');
                sessionStorage.setItem('supabase_signup_hash', hash);
                setLocation('/confirm');
            }
            else {
                console.log('AuthRedirect - Unknown auth type or missing tokens');
                setLocation('/login');
            }
        };
        processAuthRedirect();
    }, [setLocation]);
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "\u8A8D\u8A3C\u51E6\u7406\u4E2D..." })] }) }));
}
