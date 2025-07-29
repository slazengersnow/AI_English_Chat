"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DebugEmail;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const card_1 = require("@/components/ui/card");
const use_toast_1 = require("@/hooks/use-toast");
const supabase_1 = require("@shared/supabase");
const lucide_react_1 = require("lucide-react");
function DebugEmail() {
    const [email, setEmail] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [debugInfo, setDebugInfo] = (0, react_1.useState)('');
    const { toast } = (0, use_toast_1.useToast)();
    const testPasswordReset = async () => {
        if (!email) {
            toast({
                title: "メールアドレスが必要です",
                description: "テスト用のメールアドレスを入力してください",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);
        setDebugInfo('');
        try {
            const currentOrigin = window.location.origin;
            const redirectUrl = `${currentOrigin}/reset-password`;
            console.log('Testing password reset with:', {
                email,
                redirectUrl,
                origin: currentOrigin
            });
            const { data, error } = await supabase_1.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });
            const debugResult = {
                email,
                redirectUrl,
                origin: currentOrigin,
                data: data || null,
                error: error || null,
                timestamp: new Date().toISOString()
            };
            setDebugInfo(JSON.stringify(debugResult, null, 2));
            console.log('Password reset debug result:', debugResult);
            if (error) {
                console.error('Password reset error:', error);
                toast({
                    title: "パスワードリセットエラー",
                    description: `エラー: ${error.message}`,
                    variant: "destructive",
                });
            }
            else {
                toast({
                    title: "パスワードリセットメール送信完了",
                    description: "メール送信処理が完了しました。デバッグ情報を確認してください。",
                });
            }
        }
        catch (error) {
            console.error('Password reset exception:', error);
            toast({
                title: "エラー",
                description: "パスワードリセット中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const testSupabaseConnection = async () => {
        try {
            const { data, error } = await supabase_1.supabase.auth.getSession();
            console.log('Supabase connection test:', { data, error });
            const connectionInfo = {
                hasSession: !!data.session,
                user: data.session?.user?.email || null,
                error: error || null,
                timestamp: new Date().toISOString()
            };
            setDebugInfo(JSON.stringify(connectionInfo, null, 2));
            toast({
                title: "Supabase接続テスト完了",
                description: "結果をデバッグ情報で確認してください",
            });
        }
        catch (error) {
            console.error('Supabase connection test error:', error);
            toast({
                title: "接続テストエラー",
                description: "Supabaseへの接続テストに失敗しました",
                variant: "destructive",
            });
        }
    };
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <card_1.Card className="w-full max-w-2xl">
        <card_1.CardHeader className="text-center">
          <card_1.CardTitle className="text-2xl">メール送信デバッグ</card_1.CardTitle>
          <card_1.CardDescription>
            パスワードリセットメールの送信をテストします
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-6">
          <div className="space-y-2">
            <label_1.Label htmlFor="email">メールアドレス</label_1.Label>
            <div className="relative">
              <lucide_react_1.Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
              <input_1.Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="test@example.com" className="pl-10"/>
            </div>
          </div>

          <div className="space-y-2">
            <button_1.Button onClick={testPasswordReset} disabled={isLoading} className="w-full">
              {isLoading ? "送信テスト中..." : "パスワードリセットメール送信テスト"}
            </button_1.Button>
            
            <button_1.Button onClick={testSupabaseConnection} variant="outline" className="w-full">
              Supabase接続テスト
            </button_1.Button>
          </div>

          {debugInfo && (<div className="space-y-2">
              <label_1.Label>デバッグ情報</label_1.Label>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                {debugInfo}
              </pre>
            </div>)}
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
