import { useState } from "react";
import { DifficultySelection } from "@/components/difficulty-selection";
import { TrainingInterface } from "@/components/training-interface";
import { PaymentModal } from "@/components/payment-modal";
import type { DifficultyKey } from "@/lib/constants";

export default function Home() {
  const [currentView, setCurrentView] = useState<'difficulty' | 'training'>('difficulty');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyKey | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleDifficultySelect = (difficulty: DifficultyKey) => {
    setSelectedDifficulty(difficulty);
    setCurrentView('training');
  };

  const handleBackToDifficulty = () => {
    setCurrentView('difficulty');
    setSelectedDifficulty(null);
    setShowPaymentModal(false);
  };

  const handleShowPayment = () => {
    setShowPaymentModal(true);
  };

  const handleClosePayment = () => {
    setShowPaymentModal(false);
  };

  return (
    <>
      {currentView === 'difficulty' && (
        <DifficultySelection onDifficultySelect={handleDifficultySelect} />
      )}
      
      {currentView === 'training' && selectedDifficulty && (
        <TrainingInterface 
          difficulty={selectedDifficulty}
          onBack={handleBackToDifficulty}
          onShowPayment={handleShowPayment}
        />
      )}
      
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={handleClosePayment}
      />
    </>
  );
}