"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FixEmail;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const card_1 = require("@/components/ui/card");
const use_toast_1 = require("@/hooks/use-toast");
const supabase_1 = require("@shared/supabase");
const lucide_react_1 = require("lucide-react");
function FixEmail() {
    const [email, setEmail] = (0, react_1.useState)("slazengersnow@gmail.com");
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [fixResults, setFixResults] = (0, react_1.useState)([]);
    const { toast } = (0, use_toast_1.useToast)();
    const addResult = (step, success, message, details) => {
        setFixResults((prev) => [
            ...prev,
            {
                step,
                success,
                message,
                details,
                timestamp: new Date().toISOString(),
            },
        ]);
    };
    const fixEmailIssue = async () => {
        setIsLoading(true);
        setFixResults([]);
        try {
            // Step 1: Check if user exists
            addResult("ユーザー確認", true, "ユーザー存在確認を開始...");
            // First, try to sign up the user to ensure they exist
            const { data: signUpData, error: signUpError } = await supabase_1.supabase.auth.signUp({
                email: email,
                password: "TempPassword123!",
                options: {
                    emailRedirectTo: `${window.location.origin}/reset-password`,
                },
            });
            if (signUpError) {
                if (signUpError.message.includes("already registered")) {
                    addResult("ユーザー確認", true, "ユーザーは既に登録済みです");
                }
                else {
                    addResult("ユーザー確認", false, `サインアップエラー: ${signUpError.message}`);
                }
            }
            else {
                addResult("ユーザー確認", true, "ユーザーを新規作成しました");
            }
            // Step 2: Try different password reset approaches
            const resetAttempts = [
                {
                    name: "基本リセット",
                    config: {
                        redirectTo: `${window.location.origin}/reset-password`,
                    },
                },
                {
                    name: "HTTPSリセット",
                    config: {
                        redirectTo: `https://${window.location.host}/reset-password`,
                    },
                },
                {
                    name: "ルートリダイレクト",
                    config: {
                        redirectTo: `${window.location.origin}/`,
                    },
                },
                {
                    name: "オプション無し",
                    config: undefined,
                },
            ];
            for (const attempt of resetAttempts) {
                addResult("パスワードリセット", true, `${attempt.name}を試行中...`);
                const { data, error } = await supabase_1.supabase.auth.resetPasswordForEmail(email, attempt.config);
                if (error) {
                    addResult("パスワードリセット", false, `${attempt.name}失敗: ${error.message}`);
                }
                else {
                    addResult("パスワードリセット", true, `${attempt.name}成功！`);
                    // If successful, stop trying other methods
                    toast({
                        title: "修正完了",
                        description: `${attempt.name}でメール送信が成功しました`,
                    });
                    setIsLoading(false);
                    return;
                }
                // Wait between attempts
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
            // Step 3: Try resend confirmation
            addResult("確認メール再送", true, "確認メールの再送を試行中...");
            const { data: resendData, error: resendError } = await supabase_1.supabase.auth.resend({
                type: "signup",
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/reset-password`,
                },
            });
            if (resendError) {
                addResult("確認メール再送", false, `再送失敗: ${resendError.message}`);
            }
            else {
                addResult("確認メール再送", true, "確認メール再送成功！");
            }
            // Step 4: Emergency server-side reset
            addResult("緊急リセット要求", true, "サーバーサイドの緊急リセットを試行中...");
            try {
                const emergencyResponse = await fetch("/api/emergency-reset", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                });
                const emergencyData = await emergencyResponse.json();
                if (emergencyResponse.ok && emergencyData.success) {
                    addResult("緊急リセット要求", true, "緊急アクセス解決策を生成しました！");
                    // Show emergency credentials
                    if (emergencyData.solution) {
                        const solution = emergencyData.solution;
                        addResult("緊急アクセス情報", true, `
              一時パスワード: ${solution.credentials.temporaryPassword}
              有効期限: ${new Date(solution.expires).toLocaleString()}
              ログインURL: ${solution.loginUrl}
            `);
                        toast({
                            title: "緊急アクセス解決策",
                            description: "一時パスワードでログインできます。詳細は下記を確認してください。",
                        });
                    }
                }
                else {
                    addResult("緊急リセット要求", false, `緊急リセット失敗: ${emergencyData.error}`);
                }
            }
            catch (emergencyError) {
                addResult("緊急リセット要求", false, `緊急リセット通信エラー: ${emergencyError.message}`);
            }
            toast({
                title: "修正プロセス完了",
                description: "全ての修正手順が完了しました。結果を確認してください。",
            });
        }
        catch (error) {
            console.error("Fix email error:", error);
            addResult("エラー", false, `修正プロセスでエラーが発生: ${error.message}`);
            toast({
                title: "修正エラー",
                description: "メール送信の修正中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <card_1.Card className="w-full max-w-4xl">
        <card_1.CardHeader className="text-center">
          <card_1.CardTitle className="text-2xl flex items-center justify-center gap-2">
            <lucide_react_1.Mail className="w-6 h-6"/>
            メール送信問題の修正
          </card_1.CardTitle>
          <card_1.CardDescription>
            Supabaseのメール送信問題を包括的に修正します
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-6">
          <div className="space-y-2">
            <label_1.Label htmlFor="email">メールアドレス</label_1.Label>
            <input_1.Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="slazengersnow@gmail.com"/>
          </div>

          <button_1.Button onClick={fixEmailIssue} disabled={isLoading} className="w-full">
            {isLoading ? "修正中..." : "メール送信問題を修正する"}
          </button_1.Button>

          {fixResults.length > 0 && (<div className="space-y-2">
              <label_1.Label>修正プロセス</label_1.Label>
              <div className="bg-white border rounded-lg p-4 max-h-96 overflow-auto">
                {fixResults.map((result, index) => (<div key={index} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                    {result.success ? (<lucide_react_1.CheckCircle className="w-5 h-5 text-green-500 mt-0.5"/>) : (<lucide_react_1.AlertTriangle className="w-5 h-5 text-red-500 mt-0.5"/>)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.step}</div>
                      <div className="text-sm text-gray-600">
                        {result.message}
                      </div>
                      {result.details && (<div className="text-xs text-gray-500 mt-1">
                          {typeof result.details === "string"
                        ? result.details
                        : JSON.stringify(result.details)}
                        </div>)}
                      <div className="text-xs text-gray-400">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>))}
              </div>
            </div>)}

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">重要な注意事項</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• このツールは複数のアプローチでメール送信を試行します</li>
              <li>• 管理者権限を使用して直接リセットリンクを生成します</li>
              <li>
                • 成功した場合、そのリンクを使用してパスワードリセットが可能です
              </li>
              <li>
                •
                全ての手順でエラーが発生する場合、Supabaseの設定に問題がある可能性があります
              </li>
            </ul>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
