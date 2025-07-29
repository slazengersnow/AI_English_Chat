"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Success;
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const wouter_1 = require("wouter");
function Success() {
    return (<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-6 flex items-center justify-center">
          <lucide_react_1.Check className="w-10 h-10 text-white"/>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          決済が完了しました！
        </h1>

        {/* Premium Badge */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <lucide_react_1.Crown className="w-5 h-5 text-purple-600"/>
          <span className="text-purple-600 font-semibold">プレミアム会員</span>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          7日間無料トライアルが開始されました。<br />
          これで無制限の練習問題と詳細な添削フィードバックをご利用いただけます。
        </p>

        {/* Features */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">利用可能な機能</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <lucide_react_1.Check className="w-4 h-4 text-green-500"/>
              <span>無制限の練習問題</span>
            </div>
            <div className="flex items-center space-x-2">
              <lucide_react_1.Check className="w-4 h-4 text-green-500"/>
              <span>詳細な添削フィードバック</span>
            </div>
            <div className="flex items-center space-x-2">
              <lucide_react_1.Check className="w-4 h-4 text-green-500"/>
              <span>復習機能とブックマーク</span>
            </div>
            <div className="flex items-center space-x-2">
              <lucide_react_1.Check className="w-4 h-4 text-green-500"/>
              <span>シミュレーション練習</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <wouter_1.Link href="/">
          <button_1.Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-medium">
            練習を始める
            <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
          </button_1.Button>
        </wouter_1.Link>

        {/* Note */}
        <p className="text-xs text-gray-500 mt-4">
          確認メールをお送りしました。トライアル期間中はいつでもキャンセル可能です。
        </p>
      </div>
    </div>);
}
