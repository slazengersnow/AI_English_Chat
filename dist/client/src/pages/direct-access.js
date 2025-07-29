"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DirectAccess;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const card_1 = require("@/components/ui/card");
const use_toast_1 = require("@/hooks/use-toast");
const supabase_1 = require("@shared/supabase");
const wouter_1 = require("wouter");
const lucide_react_1 = require("lucide-react");
function DirectAccess() {
    const [email, setEmail] = (0, react_1.useState)('slazengersnow@gmail.com');
    const [tempPassword, setTempPassword] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [, setLocation] = (0, wouter_1.useLocation)();
    const { toast } = (0, use_toast_1.useToast)();
    const handleDirectLogin = async () => {
        if (!email || !tempPassword) {
            toast({
                title: "入力エラー",
                description: "メールアドレスと一時パスワードを入力してください",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);
        try {
            // Try to sign in with the temporary password
            const { data, error } = await supabase_1.supabase.auth.signInWithPassword({
                email: email,
                password: tempPassword,
            });
            if (error) {
                // If login fails, try to create a new account
                console.log('Login failed, trying to create new account:', error.message);
                const { data: signUpData, error: signUpError } = await supabase_1.supabase.auth.signUp({
                    email: email,
                    password: tempPassword,
                });
                if (signUpError) {
                    toast({
                        title: "アクセスエラー",
                        description: `アカウント作成に失敗しました: ${signUpError.message}`,
                        variant: "destructive",
                    });
                    return;
                }
                toast({
                    title: "アカウント作成成功",
                    description: "新しいアカウントを作成しました。パスワードを変更してください。",
                });
                // Redirect to home page
                setLocation('/');
            }
            else {
                toast({
                    title: "ログイン成功",
                    description: "一時パスワードでログインできました。",
                });
                // Redirect to home page
                setLocation('/');
            }
        }
        catch (error) {
            console.error('Direct access error:', error);
            toast({
                title: "エラー",
                description: "直接アクセス中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const generateEmergencyCredentials = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/emergency-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                const solution = data.solution;
                setTempPassword(solution.credentials.temporaryPassword);
                toast({
                    title: "緊急パスワード生成成功",
                    description: "一時パスワードを生成しました。24時間有効です。",
                });
            }
            else {
                toast({
                    title: "パスワード生成エラー",
                    description: data.error || "パスワードの生成に失敗しました",
                    variant: "destructive",
                });
            }
        }
        catch (error) {
            console.error('Emergency credentials error:', error);
            toast({
                title: "エラー",
                description: "緊急パスワード生成中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <card_1.Card className="w-full max-w-md">
        <card_1.CardHeader className="text-center">
          <card_1.CardTitle className="text-2xl flex items-center justify-center gap-2">
            <lucide_react_1.Key className="w-6 h-6"/>
            緊急アクセス
          </card_1.CardTitle>
          <card_1.CardDescription>
            メール送信問題の回避策として、直接アクセスを提供します
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-6">
          <div className="space-y-2">
            <label_1.Label htmlFor="email">メールアドレス</label_1.Label>
            <input_1.Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="slazengersnow@gmail.com"/>
          </div>

          <div className="space-y-2">
            <label_1.Label htmlFor="tempPassword">一時パスワード</label_1.Label>
            <input_1.Input id="tempPassword" type="password" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} placeholder="緊急パスワード"/>
          </div>

          <div className="space-y-2">
            <button_1.Button onClick={generateEmergencyCredentials} disabled={isLoading} variant="outline" className="w-full">
              {isLoading ? "生成中..." : "緊急パスワードを生成"}
            </button_1.Button>
            
            <button_1.Button onClick={handleDirectLogin} disabled={isLoading || !tempPassword} className="w-full">
              {isLoading ? "アクセス中..." : "直接アクセス"}
            </button_1.Button>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <lucide_react_1.AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0"/>
              <div className="text-sm text-orange-700">
                <p className="font-medium mb-1">重要な注意事項：</p>
                <ul className="space-y-1 text-xs">
                  <li>• 一時パスワードは24時間で無効になります</li>
                  <li>• ログイン後、必ずパスワードを変更してください</li>
                  <li>• この機能はメール送信問題の一時的な解決策です</li>
                  <li>• 生成されたパスワードは他人に共有しないでください</li>
                </ul>
              </div>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
