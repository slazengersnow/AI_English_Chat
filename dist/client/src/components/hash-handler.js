"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashHandler = HashHandler;
const react_1 = require("react");
const wouter_1 = require("wouter");
function HashHandler() {
    const [, setLocation] = (0, wouter_1.useLocation)();
    (0, react_1.useEffect)(() => {
        // Check immediately when component mounts
        const checkHash = () => {
            const hash = window.location.hash;
            const url = window.location.href;
            const pathname = window.location.pathname;
            console.log("HashHandler - Full URL:", url);
            console.log("HashHandler - Hash:", hash);
            console.log("HashHandler - Pathname:", pathname);
            if (!hash) {
                console.log("HashHandler - No hash found");
                return;
            }
            // Parse hash parameters
            const params = new URLSearchParams(hash.substring(1)); // Remove # prefix
            const type = params.get("type");
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");
            console.log("HashHandler - Parsed params:", {
                type,
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken,
            });
            if (type === "recovery" && accessToken) {
                console.log("HashHandler - Detected password recovery, redirecting to reset-password");
                // Store the hash for the reset-password page to use
                sessionStorage.setItem("supabase_recovery_hash", hash);
                // Clear the hash from URL to prevent loops
                window.history.replaceState({}, "", pathname);
                // Redirect to reset-password page
                setLocation("/reset-password");
            }
            else if (type === "signup" && accessToken) {
                console.log("HashHandler - Detected signup confirmation, processing authentication");
                // For signup confirmation, we need to set the session directly
                sessionStorage.setItem("supabase_signup_hash", hash);
                // Clear the hash from URL
                window.history.replaceState({}, "", pathname);
                // Set the session with the tokens
                const expiresAt = params.get("expires_at");
                const tokenType = params.get("token_type");
                if (expiresAt && tokenType && refreshToken) {
                    // Create session object
                    const session = {
                        access_token: accessToken,
                        refresh_token: refreshToken,
                        expires_at: parseInt(expiresAt),
                        token_type: tokenType,
                        user: null, // Will be populated by Supabase
                    };
                    // Set session in Supabase
                    import("@shared/supabase").then(({ supabase }) => {
                        // Use the corrected setSession method
                        if (session.refresh_token) {
                            supabase.auth
                                .setSession({
                                access_token: session.access_token,
                                refresh_token: session.refresh_token,
                            })
                                .then((result) => {
                                console.log("Session set result:", result);
                                if (result.error) {
                                    console.error("Session set error:", result.error);
                                    setLocation("/login");
                                }
                                else {
                                    console.log("Session set successfully, redirecting to home");
                                    setLocation("/");
                                }
                            });
                        }
                        else {
                            console.error("No refresh token available for session");
                            setLocation("/login");
                        }
                    });
                }
                else {
                    setLocation("/confirm");
                }
            }
            else if (accessToken) {
                console.log("HashHandler - Detected access token, processing authentication");
                // General case: any access token should authenticate the user
                const expiresAt = params.get("expires_at");
                const tokenType = params.get("token_type") || "bearer";
                if (expiresAt && refreshToken) {
                    const session = {
                        access_token: accessToken,
                        refresh_token: refreshToken,
                        expires_at: parseInt(expiresAt),
                        token_type: tokenType,
                        user: null,
                    };
                    // Clear the hash from URL
                    window.history.replaceState({}, "", pathname);
                    // Set session in Supabase
                    import("@shared/supabase").then(({ supabase }) => {
                        // Use the corrected setSession method
                        if (session.refresh_token) {
                            supabase.auth
                                .setSession({
                                access_token: session.access_token,
                                refresh_token: session.refresh_token,
                            })
                                .then((result) => {
                                console.log("General session set result:", result);
                                if (result.error) {
                                    console.error("General session set error:", result.error);
                                    setLocation("/login");
                                }
                                else {
                                    console.log("General session set successfully, redirecting to home");
                                    setLocation("/");
                                }
                            });
                        }
                        else {
                            console.error("No refresh token available for general session");
                            setLocation("/login");
                        }
                    });
                }
            }
        };
        // Run immediately
        checkHash();
        // Also listen for hash changes
        const handleHashChange = () => {
            console.log("HashHandler - Hash changed:", window.location.hash);
            checkHash();
        };
        window.addEventListener("hashchange", handleHashChange);
        return () => {
            window.removeEventListener("hashchange", handleHashChange);
        };
    }, [setLocation]);
    return null;
}
