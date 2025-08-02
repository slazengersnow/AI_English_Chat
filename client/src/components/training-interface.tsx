import React from "react";
import { OneProblemOnly } from "./one-problem-only";
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
    <OneProblemOnly 
      difficulty={difficulty} 
      onBack={onBack} 
    />
  );
}