import React from "react";
import { SingleProblemPractice } from "./single-problem-practice";
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
    <SingleProblemPractice 
      difficulty={difficulty} 
      onBack={onBack} 
    />
  );
}