import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';

export default function SubscriptionSelect() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'standard',
      name: 'スタンダード',
      price: '¥980',
      period: '/月',
      features: [
        '月額980円',
        '基本練習機能（全レベル対応）',
        '1日50問まで',
        '詳しい解説・類似フレーズ',
        '基本的な進捗管理'
      ],
      buttonText: '申し込む',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'standard-yearly',
      name: 'スタンダード年間',
      price: '¥9,800',
      period: '/年',
      originalPrice: '¥11,760',
      discount: '年額16%お得（2ヶ月無料）',
      popular: true,
      features: [
        '年額9,800円（2ヶ月無料）',
        '基本練習機能（全レベル対応）',
        '1日50問まで',
        '詳しい解説・類似フレーズ',
        '基本的な進捗管理'
      ],
      buttonText: '申し込む',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    // Stripe決済ページに遷移
    navigate(`/checkout?plan=${planId}`);
  };

  const handleSkipTrial = () => {
    // 7日間無料トライアルで開始
    navigate('/payment-success?trial=true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            プランを選択してください
          </h1>
          <p className="text-gray-600 text-lg">
            AI英作文チャットで英語力を向上させましょう
          </p>
        </div>

        {/* 7日間無料トライアル */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="bg-green-100 text-green-800 px-4 py-2 text-lg">
            <Star className="w-4 h-4 mr-1" />
            7日間無料トライアル
          </Badge>
        </div>

        {/* プランカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-purple-500 border-2' : 'border-gray-200'} hover:shadow-lg transition-shadow`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-3 py-1">
                    人気
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 text-gray-400 mr-1" />
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                
                <div className="text-center">
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  </div>
                  {plan.originalPrice && (
                    <div className="text-sm text-gray-500 line-through mt-1">
                      {plan.originalPrice}
                    </div>
                  )}
                  {plan.discount && (
                    <Badge variant="secondary" className="text-xs mt-2 bg-green-100 text-green-800">
                      {plan.discount}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full ${plan.buttonColor} text-white font-medium`}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* スキップボタン */}
        <div className="text-center">
          <Button
            onClick={handleSkipTrial}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-medium"
          >
            <Star className="w-4 h-4 mr-2" />
            7日間無料トライアル
          </Button>
        </div>
      </div>
    </div>
  );
}