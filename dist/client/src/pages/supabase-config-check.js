"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SupabaseConfigCheck;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const use_toast_1 = require("@/hooks/use-toast");
const supabase_1 = require("@shared/supabase");
const lucide_react_1 = require("lucide-react");
function SupabaseConfigCheck() {
    const [configData, setConfigData] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const { toast } = (0, use_toast_1.useToast)();
    (0, react_1.useEffect)(() => {
        checkConfiguration();
    }, []);
    const checkConfiguration = async () => {
        setIsLoading(true);
        try {
            // Check environment variables
            const envConfig = {
                hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
                hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
                supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
                keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
                isDev: import.meta.env.DEV,
                mode: import.meta.env.MODE,
            };
            // Check Supabase client initialization
            const clientCheck = {
                clientInitialized: !!supabase_1.supabase,
                clientUrl: import.meta.env.VITE_SUPABASE_URL,
                clientKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + "...",
            };
            // Test basic Supabase operations
            const operationTests = [];
            // Test 1: Get session
            try {
                const { data: sessionData, error: sessionError } = await supabase_1.supabase.auth.getSession();
                operationTests.push({
                    test: "getSession",
                    success: !sessionError,
                    result: sessionError ? sessionError.message : "Success",
                    hasUser: !!sessionData?.session?.user,
                });
            }
            catch (e) {
                operationTests.push({
                    test: "getSession",
                    success: false,
                    result: e.message || String(e),
                    hasUser: false,
                });
            }
            // Test 2: Get user
            try {
                const { data: userData, error: userError } = await supabase_1.supabase.auth.getUser();
                operationTests.push({
                    test: "getUser",
                    success: !userError,
                    result: userError ? userError.message : "Success",
                    hasUser: !!userData?.user,
                });
            }
            catch (e) {
                operationTests.push({
                    test: "getUser",
                    success: false,
                    result: e.message || String(e),
                    hasUser: false,
                });
            }
            // Test 3: Test password reset with different scenarios
            const resetTests = [];
            const testEmails = [
                "test@example.com",
                "noreply@example.com",
                "admin@example.com",
            ];
            for (const email of testEmails) {
                try {
                    const { data, error } = await supabase_1.supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                    });
                    resetTests.push({
                        email,
                        success: !error,
                        result: error ? error.message : "Reset request sent",
                        data: data || null,
                    });
                }
                catch (e) {
                    resetTests.push({
                        email,
                        success: false,
                        result: e.message || String(e),
                        data: null,
                    });
                }
                // Wait to avoid rate limiting
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            // Network and URL tests
            const networkTests = {
                origin: window.location.origin,
                host: window.location.host,
                protocol: window.location.protocol,
                isHttps: window.location.protocol === "https:",
                userAgent: navigator.userAgent,
                language: navigator.language,
            };
            setConfigData({
                envConfig,
                clientCheck,
                operationTests,
                resetTests,
                networkTests,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Configuration check error:", error);
            toast({
                title: "設定チェックエラー",
                description: "設定確認中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const renderStatus = (success) => {
        return success ? (<lucide_react_1.CheckCircle className="w-5 h-5 text-green-500"/>) : (<lucide_react_1.XCircle className="w-5 h-5 text-red-500"/>);
    };
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <card_1.Card className="w-full max-w-4xl">
        <card_1.CardHeader className="text-center">
          <card_1.CardTitle className="text-2xl flex items-center justify-center gap-2">
            <lucide_react_1.Settings className="w-6 h-6"/>
            Supabase設定診断
          </card_1.CardTitle>
          <card_1.CardDescription>
            環境変数、クライアント初期化、メール送信機能の詳細チェック
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-6">
          <div className="flex justify-center">
            <button_1.Button onClick={checkConfiguration} disabled={isLoading} className="w-full max-w-md">
              {isLoading ? "診断中..." : "設定を再チェック"}
            </button_1.Button>
          </div>

          {configData && (<div className="space-y-6">
              {/* Environment Configuration */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <lucide_react_1.AlertCircle className="w-4 h-4"/>
                  環境設定
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {renderStatus(configData.envConfig.hasSupabaseUrl)}
                    <span>
                      Supabase URL:{" "}
                      {configData.envConfig.hasSupabaseUrl
                ? "設定済み"
                : "未設定"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatus(configData.envConfig.hasSupabaseKey)}
                    <span>
                      Supabase Key:{" "}
                      {configData.envConfig.hasSupabaseKey
                ? "設定済み"
                : "未設定"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 col-span-2">
                    URL: {configData.envConfig.supabaseUrl}
                  </div>
                  <div className="text-xs text-gray-600 col-span-2">
                    Key長: {configData.envConfig.keyLength} 文字
                  </div>
                </div>
              </div>

              {/* Client Check */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-3">クライアント初期化</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {renderStatus(configData.clientCheck.clientInitialized)}
                    <span>
                      クライアント初期化:{" "}
                      {configData.clientCheck.clientInitialized
                ? "成功"
                : "失敗"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    クライアントURL: {configData.clientCheck.clientUrl}
                  </div>
                </div>
              </div>

              {/* Operation Tests */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-3">基本操作テスト</h3>
                <div className="space-y-2">
                  {configData.operationTests.map((test, index) => (<div key={index} className="flex items-center gap-2 text-sm">
                      {renderStatus(test.success)}
                      <span>
                        {test.test}: {test.result}
                      </span>
                    </div>))}
                </div>
              </div>

              {/* Reset Tests */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-3">パスワードリセットテスト</h3>
                <div className="space-y-2">
                  {configData.resetTests.map((test, index) => (<div key={index} className="flex items-center gap-2 text-sm">
                      {renderStatus(test.success)}
                      <span>
                        {test.email}: {test.result}
                      </span>
                    </div>))}
                </div>
              </div>

              {/* Network Tests */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-3">ネットワーク情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>Origin: {configData.networkTests.origin}</div>
                  <div>Host: {configData.networkTests.host}</div>
                  <div>Protocol: {configData.networkTests.protocol}</div>
                  <div className="flex items-center gap-2">
                    {renderStatus(configData.networkTests.isHttps)}
                    <span>
                      HTTPS: {configData.networkTests.isHttps ? "有効" : "無効"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Raw Data */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h3 className="font-semibold mb-3">詳細データ</h3>
                <pre className="text-xs overflow-auto max-h-96 bg-gray-900 text-green-400 p-3 rounded">
                  {JSON.stringify(configData, null, 2)}
                </pre>
              </div>
            </div>)}
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
