"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Confirm;
const react_1 = require("react");
const wouter_1 = require("wouter");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const supabase_1 = require("@shared/supabase");
function Confirm() {
    const [, setLocation] = (0, wouter_1.useLocation)();
    const [status, setStatus] = (0, react_1.useState)('loading');
    const [message, setMessage] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        const handleAuthCallback = async () => {
            try {
                const { data, error } = await supabase_1.supabase.auth.getSession();
                if (error) {
                    setStatus('error');
                    setMessage('メールアドレスの確認中にエラーが発生しました。');
                    return;
                }
                if (data.session) {
                    setStatus('success');
                    setMessage('メールアドレス認証が完了しました。');
                }
                else {
                    setStatus('error');
                    setMessage('認証セッションが見つかりません。');
                }
            }
            catch (error) {
                setStatus('error');
                setMessage('認証処理中にエラーが発生しました。');
            }
        };
        handleAuthCallback();
    }, []);
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <card_1.Card className="w-full max-w-md">
        <card_1.CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <card_1.CardTitle className="text-2xl">AI瞬間英作文チャット</card_1.CardTitle>
          <card_1.CardDescription>
            メールアドレス認証
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="text-center">
          {status === 'loading' && (<div className="space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"/>
              <p className="text-gray-600">認証を確認中...</p>
            </div>)}

          {status === 'success' && (<div className="space-y-4">
              <lucide_react_1.CheckCircle className="w-16 h-16 text-green-500 mx-auto"/>
              <h3 className="text-lg font-semibold text-green-700">認証完了</h3>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">
                ログインしてAI英作文チャットをお楽しみください。
              </p>
              <button_1.Button onClick={() => setLocation('/login')} className="w-full">
                ログインページへ
              </button_1.Button>
            </div>)}

          {status === 'error' && (<div className="space-y-4">
              <lucide_react_1.AlertCircle className="w-16 h-16 text-red-500 mx-auto"/>
              <h3 className="text-lg font-semibold text-red-700">認証エラー</h3>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">
                新しい確認メールを送信するか、サポートにお問い合わせください。
              </p>
              <div className="space-y-2">
                <button_1.Button onClick={() => setLocation('/signup')} className="w-full">
                  新規登録に戻る
                </button_1.Button>
                <button_1.Button variant="outline" onClick={() => setLocation('/login')} className="w-full">
                  ログインページへ
                </button_1.Button>
              </div>
            </div>)}
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
