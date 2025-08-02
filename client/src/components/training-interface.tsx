import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { type DifficultyKey } from "@/lib/constants";

interface TrainingInterfaceProps {
  difficulty: DifficultyKey;
  onBack: () => void;
  onShowPayment: () => void;
}

export function TrainingInterface({
  difficulty,
  onBack,
  onShowPayment,
}: TrainingInterfaceProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          TrainingInterfaceは現在無効化されています
        </h2>
        <p className="text-gray-600">
          無限ループの問題を解決するため、一時的に無効化されています。
        </p>
        <p className="text-gray-600">
          「シンプルテスト（1問のみ）」をご利用ください。
        </p>
        <Button onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>戻る</span>
        </Button>
      </div>
    </div>
  );
}