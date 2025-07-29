"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AuthRedirect;
const react_1 = require("react");
const wouter_1 = require("wouter");
function AuthRedirect() {
    const [, setLocation] = (0, wouter_1.useLocation)();
    (0, react_1.useEffect)(() => {
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
    return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"/>
        <p className="text-gray-600">認証処理中...</p>
      </div>
    </div>);
}
