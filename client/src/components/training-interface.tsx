import React from "react";
import { ProblemPractice } from "./problem-practice";
import { type DifficultyKey } from "@/lib/constants";

interface TrainingInterfaceProps {
  difficulty: DifficultyKey;
  onBack: () => void;
}

export function TrainingInterface({ difficulty, onBack }: TrainingInterfaceProps) {
  return <ProblemPractice difficulty={difficulty} onBack={onBack} />;
}