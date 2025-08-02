import React from "react";
import { SimpleProblemPractice } from "./simple-problem-practice";
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
    <SimpleProblemPractice 
      difficulty={difficulty} 
      onBack={onBack} 
    />
  );
}