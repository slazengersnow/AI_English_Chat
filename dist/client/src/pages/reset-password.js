"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ResetPassword;
const react_1 = require("react");
const wouter_1 = require("wouter");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const card_1 = require("@/components/ui/card");
const use_toast_1 = require("@/hooks/use-toast");
const supabase_1 = require("@shared/supabase");
const lucide_react_1 = require("lucide-react");
function ResetPassword() {
    const [, setLocation] = (0, wouter_1.useLocation)();
    const { toast } = (0, use_toast_1.useToast)();
    const [password, setPassword] = (0, react_1.useState)('');
    const [confirmPassword, setConfirmPassword] = (0, react_1.useState)('');
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [showConfirmPassword, setShowConfirmPassword] = (0, react_1.useState)(false);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [isValidToken, setIsValidToken] = (0, react_1.useState)(false);
    const [debugInfo, setDebugInfo] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        const checkToken = async () => {
            const url = window.location.href;
            const searchParams = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            // Check if we have stored hash from HashHandler
            const storedHash = sessionStorage.getItem('supabase_recovery_hash');
            let storedHashParams = new URLSearchParams();
            if (storedHash) {
                storedHashParams = new URLSearchParams(storedHash.substring(1));
                console.log('Found stored recovery hash:', storedHash);
            }
            // Debug information
            const debug = `
        URL: ${url}
        Search: ${window.location.search}
        Hash: ${window.location.hash}
        Stored Hash: ${storedHash || 'none'}
        Access Token (search): ${searchParams.get('access_token') ? 'present' : 'missing'}
        Access Token (hash): ${hashParams.get('access_token') ? 'present' : 'missing'}
        Access Token (stored): ${storedHashParams.get('access_token') ? 'present' : 'missing'}
        Refresh Token (search): ${searchParams.get('refresh_token') ? 'present' : 'missing'}
        Refresh Token (hash): ${hashParams.get('refresh_token') ? 'present' : 'missing'}
        Refresh Token (stored): ${storedHashParams.get('refresh_token') ? 'present' : 'missing'}
        Type (search): ${searchParams.get('type')}
        Type (hash): ${hashParams.get('type')}
        Type (stored): ${storedHashParams.get('type')}
      `;
            setDebugInfo(debug);
            console.log('Debug info:', debug);
            let accessToken = searchParams.get('access_token') || hashParams.get('access_token') || storedHashParams.get('access_token');
            let refreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token') || storedHashParams.get('refresh_token');
            let type = searchParams.get('type') || hashParams.get('type') || storedHashParams.get('type');
            if (accessToken && refreshToken && type === 'recovery') {
                try {
                    console.log('Setting session with tokens...');
                    const { data, error } = await supabase_1.supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (error) {
                        console.error('Session error:', error);
                        toast({
                            title: "セッションエラー",
                            description: `パスワードリセットのリンクが無効です: ${error.message}`,
                            variant: "destructive",
                        });
                    }
                    else {
                        console.log('Valid session established');
                        setIsValidToken(true);
                        // Clear stored hash after successful use
                        sessionStorage.removeItem('supabase_recovery_hash');
                    }
                }
                catch (error) {
                    console.error('Token verification error:', error);
                    toast({
                        title: "エラー",
                        description: "パスワードリセットの処理中にエラーが発生しました",
                        variant: "destructive",
                    });
                }
            }
            else {
                console.log('Missing tokens or invalid type');
                toast({
                    title: "無効なリンク",
                    description: "パスワードリセットのリンクが無効です。再度パスワードリセットを実行してください。",
                    variant: "destructive",
                });
            }
        };
        checkToken();
    }, [toast]);
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        if (password !== confirmPassword) {
            toast({
                title: "パスワードエラー",
                description: "パスワードが一致しません",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }
        if (password.length < 8) {
            toast({
                title: "パスワードエラー",
                description: "パスワードは8文字以上で設定してください",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }
        try {
            const { error } = await supabase_1.supabase.auth.updateUser({
                password: password,
            });
            if (error) {
                toast({
                    title: "パスワード更新エラー",
                    description: error.message,
                    variant: "destructive",
                });
            }
            else {
                toast({
                    title: "パスワード更新完了",
                    description: "パスワードが正常に更新されました。新しいパスワードでログインしてください。",
                });
                setLocation('/login');
            }
        }
        catch (error) {
            toast({
                title: "エラー",
                description: "パスワード更新中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleReturnToLogin = () => {
        setLocation('/login');
    };
    if (!isValidToken) {
        return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <card_1.Card className="w-full max-w-md">
          <card_1.CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <lucide_react_1.AlertCircle className="text-red-500 w-8 h-8"/>
            </div>
            <card_1.CardTitle className="text-2xl">リンクが無効です</card_1.CardTitle>
            <card_1.CardDescription>
              パスワードリセットのリンクが無効または期限切れです
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>以下の理由が考えられます：</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>リンクの有効期限が切れている</li>
                <li>既にパスワードが変更されている</li>
                <li>リンクが正しくコピーされていない</li>
              </ul>
            </div>
            
            <button_1.Button onClick={handleReturnToLogin} className="w-full">
              ログインページに戻る
            </button_1.Button>
            
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500">デバッグ情報</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {debugInfo}
              </pre>
            </details>
          </card_1.CardContent>
        </card_1.Card>
      </div>);
    }
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <card_1.Card className="w-full max-w-md">
        <card_1.CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <lucide_react_1.Lock className="text-white w-8 h-8"/>
          </div>
          <card_1.CardTitle className="text-2xl">パスワードリセット</card_1.CardTitle>
          <card_1.CardDescription>
            新しいパスワードを設定してください
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <label_1.Label htmlFor="password">新しいパスワード</label_1.Label>
              <div className="relative">
                <lucide_react_1.Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                <input_1.Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8文字以上のパスワード" className="pl-10 pr-10" required/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <lucide_react_1.EyeOff className="w-4 h-4"/> : <lucide_react_1.Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="confirmPassword">パスワード確認</label_1.Label>
              <div className="relative">
                <lucide_react_1.Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                <input_1.Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="パスワードを再入力" className="pl-10 pr-10" required/>
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmPassword ? <lucide_react_1.EyeOff className="w-4 h-4"/> : <lucide_react_1.Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            <button_1.Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "更新中..." : "パスワードを更新"}
            </button_1.Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button_1.Button variant="link" className="text-gray-600 hover:text-gray-800" onClick={handleReturnToLogin}>
              ログインページに戻る
            </button_1.Button>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
