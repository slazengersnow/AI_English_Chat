"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DebugAuth;
const react_1 = require("react");
const supabase_1 = require("@shared/supabase");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
function DebugAuth() {
    const [debugInfo, setDebugInfo] = (0, react_1.useState)({});
    (0, react_1.useEffect)(() => {
        const getCurrentUrl = () => {
            const currentUrl = window.location.origin;
            const replitUrl = `https://${import.meta.env.VITE_REPL_ID || 'ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d'}.replit.app`;
            setDebugInfo({
                currentUrl,
                replitUrl,
                supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
                hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
                redirectUrl: `${currentUrl}/auth/callback`,
                replitRedirectUrl: `${replitUrl}/auth/callback`,
            });
        };
        getCurrentUrl();
    }, []);
    const testGoogleAuth = async () => {
        try {
            console.log('Testing Google OAuth with debug info:', debugInfo);
            const { data, error } = await supabase_1.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: debugInfo.replitRedirectUrl,
                },
            });
            console.log('OAuth test result:', { data, error });
        }
        catch (error) {
            console.error('OAuth test error:', error);
        }
    };
    return (<div className="min-h-screen bg-gray-100 p-4">
      <card_1.Card className="max-w-2xl mx-auto">
        <card_1.CardHeader>
          <card_1.CardTitle>認証デバッグ情報</card_1.CardTitle>
          <card_1.CardDescription>Google OAuth認証のデバッグ情報</card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">現在のURL:</h3>
              <p className="text-sm text-gray-600">{debugInfo.currentUrl}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Replit URL:</h3>
              <p className="text-sm text-gray-600">{debugInfo.replitUrl}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Supabase URL:</h3>
              <p className="text-sm text-gray-600">{debugInfo.supabaseUrl}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Supabase Key:</h3>
              <p className="text-sm text-gray-600">{debugInfo.hasSupabaseKey ? '設定済み' : '未設定'}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">リダイレクトURL:</h3>
              <p className="text-sm text-gray-600">{debugInfo.redirectUrl}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">ReplitリダイレクトURL:</h3>
              <p className="text-sm text-gray-600">{debugInfo.replitRedirectUrl}</p>
            </div>
            
            <div className="pt-4">
              <button_1.Button onClick={testGoogleAuth} className="w-full">
                Google認証テスト
              </button_1.Button>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Google Consoleで設定すべき項目：</strong></p>
              <ul className="list-disc pl-5 mt-2">
                <li>承認済みのJavaScript生成元: https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app</li>
                <li>承認済みのリダイレクトURI: https://xcjplyhqxgrbdhixmzse.supabase.co/auth/v1/callback</li>
              </ul>
              
              <p className="mt-4"><strong>Supabaseで設定すべき項目：</strong></p>
              <ul className="list-disc pl-5 mt-2">
                <li>Site URL: https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app</li>
                <li>Redirect URLs: https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app/auth/callback</li>
              </ul>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
