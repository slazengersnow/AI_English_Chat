"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AuthCallback;
const react_1 = require("react");
const wouter_1 = require("wouter");
const supabase_1 = require("@shared/supabase");
const use_toast_1 = require("@/hooks/use-toast");
function AuthCallback() {
    const [, setLocation] = (0, wouter_1.useLocation)();
    const { toast } = (0, use_toast_1.useToast)();
    (0, react_1.useEffect)(() => {
        const handleAuthCallback = async () => {
            const hash = window.location.hash;
            const search = window.location.search;
            console.log("AuthCallback - Hash:", hash);
            console.log("AuthCallback - Search:", search);
            if (hash) {
                // Parse hash parameters
                const params = new URLSearchParams(hash.substring(1));
                const accessToken = params.get("access_token");
                const refreshToken = params.get("refresh_token");
                const expiresAt = params.get("expires_at");
                const tokenType = params.get("token_type");
                const type = params.get("type");
                console.log("AuthCallback - Parsed params:", {
                    type,
                    hasAccessToken: !!accessToken,
                    hasRefreshToken: !!refreshToken,
                    expiresAt,
                    tokenType,
                });
                if (accessToken && expiresAt) {
                    try {
                        // Create session object with proper typing
                        const sessionData = {
                            access_token: accessToken,
                            refresh_token: refreshToken || "",
                            expires_at: parseInt(expiresAt),
                            token_type: tokenType || "bearer",
                            user: null,
                        };
                        // setSessionにはexpires_atは不要なので、削除
                        const { access_token, refresh_token } = sessionData;
                        const { data, error } = await supabase_1.supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        });
                        if (error) {
                            console.error("Session set error:", error);
                            toast({
                                title: "認証エラー",
                                description: `認証に失敗しました: ${error.message}`,
                                variant: "destructive",
                            });
                            setLocation("/login");
                        }
                        else {
                            console.log("Session set successfully:", data);
                            // Clear the hash from URL
                            window.history.replaceState({}, "", window.location.pathname);
                            toast({
                                title: "認証成功",
                                description: "ログインが完了しました！",
                            });
                            // Redirect to home
                            setLocation("/");
                        }
                    }
                    catch (error) {
                        console.error("Auth callback error:", error);
                        toast({
                            title: "認証エラー",
                            description: "認証処理中にエラーが発生しました",
                            variant: "destructive",
                        });
                        setLocation("/login");
                    }
                }
                else {
                    console.log("Missing required auth parameters");
                    toast({
                        title: "認証エラー",
                        description: "認証パラメータが不足しています",
                        variant: "destructive",
                    });
                    setLocation("/login");
                }
            }
            else if (search) {
                // Handle search parameters (for error cases)
                const searchParams = new URLSearchParams(search);
                const error = searchParams.get("error");
                const errorDescription = searchParams.get("error_description");
                if (error) {
                    console.error("Auth error from search params:", {
                        error,
                        errorDescription,
                    });
                    toast({
                        title: "認証エラー",
                        description: errorDescription || `認証エラーが発生しました: ${error}`,
                        variant: "destructive",
                    });
                    setLocation("/login");
                    return;
                }
                console.log("Search params found but no error, redirecting to login");
                setLocation("/login");
            }
            else {
                console.log("No hash or search params found in auth callback");
                setLocation("/login");
            }
        };
        handleAuthCallback();
    }, [setLocation, toast]);
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-sm w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            認証を処理中...
          </h2>
          <p className="text-gray-600 text-sm">しばらくお待ちください</p>
        </div>
      </div>
    </div>);
}
