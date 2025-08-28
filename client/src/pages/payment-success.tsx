import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isTrial = searchParams.get('trial') === 'true';
  const planId = searchParams.get('plan') || 'standard';

  // プラン別の特典を定義
  const planFeatures = {
    standard: [
      '基本練習機能（全レベル対応）',
      '1日50問まで',
      '詳しい解説・類似フレーズ',
      '基本的な進捗管理'
    ],
    premium: [
      '基本練習機能（全レベル対応）',
      '1日100問まで',
      '詳しい解説・類似フレーズ',
      'カスタムシナリオ作成',
      '復習機能'
    ],
    'standard-yearly': [
      '基本練習機能（全レベル対応）',
      '1日50問まで',
      '詳しい解説・類似フレーズ',
      '基本的な進捗管理',
      '年額16%お得（2ヶ月無料）'
    ],
    'premium-yearly': [
      '基本練習機能（全レベル対応）',
      '1日100問まで',
      '詳しい解説・類似フレーズ',
      'カスタムシナリオ作成',
      '復習機能',
      '年額16%お得（2ヶ月無料）'
    ]
  };

  const planNames = {
    standard: 'スタンダード',
    premium: 'プレミアム',
    'standard-yearly': 'スタンダード年間',
    'premium-yearly': 'プレミアム年間'
  };

  const currentPlan = planNames[planId as keyof typeof planNames] || 'スタンダード';
  const currentFeatures = planFeatures[planId as keyof typeof planFeatures] || planFeatures.standard;

  const handleStartLearning = () => {
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
              : `${currentPlan}プランへの登録が完了しました`
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* プランの特典 */}
          {!isTrial && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-3">{currentPlan}プランの特典</h3>
              <ul className="space-y-2">
                {currentFeatures.map((feature, index) => (
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


          {/* 学習開始ボタン */}
          <Button
            onClick={handleStartLearning}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
          >
            学習を始める
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}