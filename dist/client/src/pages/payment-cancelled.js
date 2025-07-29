"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PaymentCancelled;
const wouter_1 = require("wouter");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
function PaymentCancelled() {
    const [, setLocation] = (0, wouter_1.useLocation)();
    const handleGoHome = () => {
        setLocation('/');
    };
    const handleRetryPayment = () => {
        setLocation('/subscription/select');
    };
    return (<div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <card_1.Card className="w-full max-w-md text-center">
        <card_1.CardHeader className="pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <lucide_react_1.XCircle className="w-8 h-8 text-red-600"/>
          </div>
          <card_1.CardTitle className="text-2xl text-red-800">
            決済がキャンセルされました
          </card_1.CardTitle>
          <card_1.CardDescription className="text-red-700">
            決済処理が中断されました
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <h3 className="font-semibold mb-2 text-red-800">
              キャンセルの理由
            </h3>
            <ul className="text-sm text-red-700 space-y-1 text-left">
              <li>• 決済情報の入力が完了していない</li>
              <li>• ページを閉じた、または戻るボタンを押した</li>
              <li>• 通信エラーが発生した</li>
              <li>• その他の技術的な問題</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold mb-2 text-blue-800">
              プレミアムプランの特典
            </h3>
            <ul className="text-sm text-blue-700 space-y-1 text-left">
              <li>• 7日間無料トライアル</li>
              <li>• 無制限の問題練習</li>
              <li>• カスタムシナリオ作成</li>
              <li>• 詳細な学習分析</li>
              <li>• 復習機能</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button_1.Button onClick={handleRetryPayment} className="w-full bg-blue-600 hover:bg-blue-700">
              <lucide_react_1.CreditCard className="w-4 h-4 mr-2"/>
              もう一度決済する
            </button_1.Button>
            <button_1.Button onClick={handleGoHome} variant="outline" className="w-full">
              <lucide_react_1.ArrowLeft className="w-4 h-4 mr-2"/>
              ホームに戻る
            </button_1.Button>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
