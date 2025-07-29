"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Cancel;
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const wouter_1 = require("wouter");
function Cancel() {
    return (<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Cancel Icon */}
        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <lucide_react_1.X className="w-10 h-10 text-gray-400"/>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          決済がキャンセルされました
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          プレミアム機能へのアップグレードがキャンセルされました。<br />
          いつでも再度お申し込みいただけます。
        </p>

        {/* Free Features */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center justify-center">
            <lucide_react_1.Heart className="w-4 h-4 mr-2"/>
            無料でもご利用いただけます
          </h3>
          <div className="space-y-2 text-sm text-blue-700">
            <div>• 基本的な練習問題</div>
            <div>• AI添削フィードバック</div>
            <div>• 進捗の記録</div>
            <div>• ブックマーク機能</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <wouter_1.Link href="/">
            <button_1.Button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium">
              <lucide_react_1.ArrowLeft className="w-4 h-4 mr-2"/>
              学習を続ける
            </button_1.Button>
          </wouter_1.Link>
          
          <div className="text-sm text-gray-500">
            または
          </div>
          
          <button_1.Button variant="outline" className="w-full" onClick={() => {
            // Trigger payment modal again
            window.history.back();
        }}>
            もう一度プレミアムを検討する
          </button_1.Button>
        </div>

        {/* Note */}
        <p className="text-xs text-gray-500 mt-6">
          プレミアム機能では無制限の練習問題、詳細な添削、シミュレーション練習などがご利用いただけます。
        </p>
      </div>
    </div>);
}
