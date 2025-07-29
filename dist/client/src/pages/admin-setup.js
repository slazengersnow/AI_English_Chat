"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminSetup;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const card_1 = require("@/components/ui/card");
const use_toast_1 = require("@/hooks/use-toast");
const supabase_1 = require("@shared/supabase");
const lucide_react_1 = require("lucide-react");
function AdminSetup() {
    const { toast } = (0, use_toast_1.useToast)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [confirmPassword, setConfirmPassword] = (0, react_1.useState)('');
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [showConfirmPassword, setShowConfirmPassword] = (0, react_1.useState)(false);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const handleSetupAccount = async (e) => {
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
            const { data, error } = await supabase_1.supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/confirm`,
                },
            });
            if (error) {
                if (error.message.includes('User already registered')) {
                    toast({
                        title: "アカウント確認",
                        description: "このメールアドレスは既に登録されています。パスワードリセットを試してください。",
                        variant: "destructive",
                    });
                }
                else {
                    toast({
                        title: "登録エラー",
                        description: error.message,
                        variant: "destructive",
                    });
                }
                return;
            }
            if (data.user) {
                toast({
                    title: "アカウント作成完了",
                    description: "確認メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。",
                });
            }
        }
        catch (error) {
            toast({
                title: "エラー",
                description: "アカウント作成中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handlePasswordReset = async () => {
        if (!email) {
            toast({
                title: "メールアドレスが必要です",
                description: "パスワードリセットにはメールアドレスを入力してください",
                variant: "destructive",
            });
            return;
        }
        try {
            const { error } = await supabase_1.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/password-reset`,
            });
            console.log('Password reset email sent for:', email);
            if (error) {
                toast({
                    title: "パスワードリセットエラー",
                    description: error.message,
                    variant: "destructive",
                });
            }
            else {
                toast({
                    title: "パスワードリセットメール送信完了",
                    description: "パスワードリセットの手順をメールで送信しました",
                });
            }
        }
        catch (error) {
            toast({
                title: "エラー",
                description: "パスワードリセット中にエラーが発生しました",
                variant: "destructive",
            });
        }
    };
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <card_1.Card className="w-full max-w-md">
        <card_1.CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">管理</span>
          </div>
          <card_1.CardTitle className="text-2xl">管理者アカウント設定</card_1.CardTitle>
          <card_1.CardDescription>
            新しいアカウントの作成またはパスワードリセット
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <form onSubmit={handleSetupAccount} className="space-y-4">
            <div className="space-y-2">
              <label_1.Label htmlFor="email">メールアドレス</label_1.Label>
              <div className="relative">
                <lucide_react_1.Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                <input_1.Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="bizmowa.com または slazengersnow@gmail.com" className="pl-10" required/>
              </div>
            </div>
            
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
              {isLoading ? "作成中..." : "アカウント作成"}
            </button_1.Button>
          </form>

          <div className="mt-4 space-y-2">
            <div className="text-center">
              <span className="text-sm text-gray-600">または</span>
            </div>
            
            <button_1.Button variant="outline" className="w-full" onClick={handlePasswordReset}>
              パスワードリセット
            </button_1.Button>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p><strong>使用方法：</strong></p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>新規アカウント作成: 全項目を入力して「アカウント作成」</li>
              <li>パスワードリセット: メールアドレスのみ入力して「パスワードリセット」</li>
              <li>確認メールが届かない場合は、迷惑メールフォルダもご確認ください</li>
            </ul>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
