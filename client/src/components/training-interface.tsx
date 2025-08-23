import React from "react";
import { ChatPractice } from "./chat-practice";
import { type DifficultyKey } from "@/lib/constants";

interface TrainingInterfaceProps {
  difficulty: DifficultyKey;
  onBack: () => void;
}

export function TrainingInterface({ difficulty, onBack }: TrainingInterfaceProps) {
  return (
    <ChatPractice 
      difficulty={difficulty}
      onBack={onBack}
    />
  );
}