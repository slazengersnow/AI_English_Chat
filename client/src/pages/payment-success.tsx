import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isTrial = searchParams.get('trial') === 'true';
  const [showSubscriptionSettings, setShowSubscriptionSettings] = useState(false);

  const premiumFeatures = [
    '無制限の問題数',
    'カスタムシナリオ作成',
    '詳細な学習分析',
    '復習機能',
    '優先サポート'
  ];

  const handleStartLearning = () => {
    navigate('/');
  };

  const handleSubscriptionSettings = () => {
    setShowSubscriptionSettings(true);
  };

  const handleSubscriptionAction = (action: 'setup' | 'cancel') => {
    if (action === 'setup') {
      // サブスクリプション設定ページに遷移
      navigate('/subscription-settings');
    } else {
      // キャンセル処理
      navigate('/subscription-cancel');
    }
  };

  const handleBackHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            決済完了
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {isTrial 
              ? '7日間無料トライアルが開始されました' 
              : 'プレミアムプランへの登録が完了しました'
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* プレミアムプランの特典 */}
          {!isTrial && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-3">プレミアムプランの特典</h3>
              <ul className="space-y-2">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-purple-800">
                    <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* トライアル期間の説明 */}
          {isTrial && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">7日間無料トライアル</h3>
              <p className="text-sm text-blue-800">
                今すぐ全ての機能をお試しいただけます。トライアル期間中はいつでもキャンセル可能です。
              </p>
            </div>
          )}

          {/* サブスクリプション設定セクション */}
          {!isTrial && !showSubscriptionSettings && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 mb-2">サブスクリプションの設定を完了してください</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleSubscriptionSettings}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  サブスクリプションを設定
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSubscriptionAction('cancel')}
                  className="w-full text-gray-600 border-gray-300"
                >
                  サブスクリプション設定を後で行う
                </Button>
              </div>
            </div>
          )}

          {/* サブスクリプション設定オプション */}
          {showSubscriptionSettings && (
            <div className="space-y-3">
              <Button
                onClick={() => handleSubscriptionAction('setup')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                サブスクリプションを設定
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSubscriptionAction('cancel')}
                className="w-full text-gray-600 border-gray-300"
              >
                サブスクリプション設定を後で行う
              </Button>
            </div>
          )}

          {/* 学習開始ボタン */}
          <Button
            onClick={handleStartLearning}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
          >
            学習を始める
          </Button>

          {/* ホームに戻るボタン */}
          <Button
            variant="ghost"
            onClick={handleBackHome}
            className="w-full text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ホームに戻る
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}