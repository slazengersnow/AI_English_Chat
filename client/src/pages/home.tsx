import { useState } from "react";
import { Link } from "wouter";
import { DifficultySelection } from "@/components/difficulty-selection";
import { TrainingInterface } from "@/components/training-interface";
import { PaymentModal } from "@/components/payment-modal";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation header */}
      <div className="fixed top-4 right-4 z-50">
        <Link href="/my-page">
          <Button variant="outline" size="sm" className="bg-white shadow-md">
            <User className="w-4 h-4 mr-2" />
            マイページ
          </Button>
        </Link>
      </div>

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
    </div>
  );
}