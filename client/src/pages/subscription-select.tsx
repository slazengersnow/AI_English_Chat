import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SubscriptionSelect() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const plans = [
    {
      id: "standard",
      name: "スタンダード",
      price: "¥980",
      period: "/月",
      features: [
        "月間50問",
        "基本練習機能（全レベル対応）",
        "1日50問まで",
        "詳しい解説・類似フレーズ",
        "基本的な進捗管理"
      ],
      buttonText: "7日間無料で開始",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
      id: "premium",
      name: "プレミアム",
      price: "¥1,300",
      period: "/月",
      features: [
        "月間1,300問",
        "基本練習機能（全レベル対応）",
        "1日100問まで",
        "詳しい解説・類似フレーズ",
        "カスタムシナリオ作成",
        "復習機能"
      ],
      buttonText: "7日間無料で開始",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      popular: true
    },
    {
      id: "standard-yearly",
      name: "スタンダード年間",
      price: "¥9,800",
      period: "/年",
      discount: "月額比較で2ヶ月お得",
      features: [
        "年会費9,800円（2ヶ月無料）",
        "基本練習機能（全レベル対応）",
        "1日50問まで",
        "詳しい解説・類似フレーズ",
        "基本的な進捗管理"
      ],
      buttonText: "7日間無料で開始",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
      id: "premium-yearly",
      name: "プレミアム年間",
      price: "¥13,000",
      period: "/年",
      discount: "月額比較で2ヶ月お得",
      features: [
        "年会費13,000円（2ヶ月無料）",
        "基本練習機能（全レベル対応）",
        "1日100問まで",
        "詳しい解説・類似フレーズ",
        "カスタムシナリオ作成",
        "復習機能"
      ],
      buttonText: "7日間無料で開始",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    // プラン選択後、メイン画面へ遷移
    navigate("/");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#e7effe" }}>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            プランを選択してください
          </h1>
          <p className="text-gray-600">
            AI英作文チャットで英語力を向上させましょう
          </p>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            ⭐ 7日間無料トライアル
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-md p-6 relative ${
                plan.popular ? "ring-2 ring-purple-500" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    人気
                  </span>
                </div>
              )}
              
              <div className="text-center mb-4">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-gray-400 mr-1">⭐</span>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {plan.name}
                  </h3>
                </div>
                <div className="mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                {plan.discount && (
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    {plan.discount}
                  </div>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600">
                    <span className="text-green-500 mr-2 mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelect(plan.id)}
                className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${plan.buttonColor}`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>※ 7日間の無料期間中はいつでもキャンセル可能です</p>
          <p>※ 無料期間終了後、選択されたプランの料金が発生します</p>
        </div>
      </div>
    </div>
  );
}