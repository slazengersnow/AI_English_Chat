import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { DifficultySelection } from "@/components/difficulty-selection";
import { TrainingInterface } from "@/components/training-interface";
import { ProblemPractice } from "@/components/problem-practice";
import { PaymentModal } from "@/components/payment-modal";
import { Button } from "@/components/ui/button";
import { User, Shield } from "lucide-react";
import { DIFFICULTY_LEVELS, type DifficultyKey } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";

export default function Home() {
  const [location] = useLocation();
  const [currentView, setCurrentView] = useState<'difficulty' | 'training' | 'test'>('difficulty');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyKey | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { isAdmin } = useAuth();

  // Check subscription status
  const { data: userSubscription } = useQuery<{
    id: number;
    userId: string;
    subscriptionType: "standard" | "premium" | "trialing";
    subscriptionStatus: string;
  }>({
    queryKey: ["/api/user-subscription"],
  });

  // Handle URL query parameters and path parameters for difficulty selection
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const difficulty = urlParams.get('difficulty') as DifficultyKey;
    
    // Check for difficulty in URL path (e.g., /chat/toeic or /practice/toeic)
    const pathMatch = location.match(/\/(chat|practice)\/(.+)/);
    const pathDifficulty = pathMatch ? pathMatch[2] as DifficultyKey : null;
    
    const targetDifficulty = difficulty || pathDifficulty;
    
    // Check for review problem in sessionStorage
    const reviewProblem = sessionStorage.getItem('reviewProblem');
    
    if (targetDifficulty && DIFFICULTY_LEVELS[targetDifficulty]) {
      setSelectedDifficulty(targetDifficulty);
      setCurrentView('training');
    } else if (reviewProblem) {
      // If there's a review problem, extract difficulty and go to training
      const problemData = JSON.parse(reviewProblem);
      if (problemData.difficultyLevel && DIFFICULTY_LEVELS[problemData.difficultyLevel as DifficultyKey]) {
        setSelectedDifficulty(problemData.difficultyLevel as DifficultyKey);
        setCurrentView('training');
      }
    }
  }, [location]);

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
      {/* Navigation header - only show on difficulty selection */}
      {currentView === 'difficulty' && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="px-4 py-2 bg-white shadow-md rounded border-gray-300 hover:bg-gray-50 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                管理者
              </Button>
            </Link>
          )}
          <Link href="/my-page">
            <Button variant="outline" size="sm" className="px-4 py-2 bg-white shadow-md rounded border-gray-300 hover:bg-gray-50 flex items-center">
              <User className="w-4 h-4 mr-2" />
              マイページ
            </Button>
          </Link>
        </div>
      )}

      {currentView === 'difficulty' && (
        <div>
          <div className="mb-4 text-center">
            <Button
              onClick={() => setCurrentView('test')}
              variant="outline"
              className="mb-4"
            >
              1問練習
            </Button>
          </div>
          <DifficultySelection onDifficultySelect={handleDifficultySelect} />
        </div>
      )}
      
      {currentView === 'training' && selectedDifficulty && (
        <TrainingInterface 
          difficulty={selectedDifficulty}
          onBack={handleBackToDifficulty}
        />
      )}
      
      {currentView === 'test' && (
        <ProblemPractice difficulty="toeic" onBack={handleBackToDifficulty} />
      )}
      
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={handleClosePayment}
      />
    </div>
  );
}