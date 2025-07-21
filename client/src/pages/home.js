import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { DifficultySelection } from "@/components/difficulty-selection";
import { TrainingInterface } from "@/components/training-interface";
import { PaymentModal } from "@/components/payment-modal";
import { Button } from "@/components/ui/button";
import { User, Shield } from "lucide-react";
import { DIFFICULTY_LEVELS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
export default function Home() {
    const [location] = useLocation();
    const [currentView, setCurrentView] = useState('difficulty');
    const [selectedDifficulty, setSelectedDifficulty] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const { isAdmin } = useAuth();
    // Check subscription status
    const { data: userSubscription } = useQuery({
        queryKey: ["/api/user-subscription"],
    });
    // Handle URL query parameters and path parameters for difficulty selection
    useEffect(() => {
        const urlParams = new URLSearchParams(location.split('?')[1] || '');
        const difficulty = urlParams.get('difficulty');
        // Check for difficulty in URL path (e.g., /chat/toeic or /practice/toeic)
        const pathMatch = location.match(/\/(chat|practice)\/(.+)/);
        const pathDifficulty = pathMatch ? pathMatch[2] : null;
        const targetDifficulty = difficulty || pathDifficulty;
        // Check for review problem in sessionStorage
        const reviewProblem = sessionStorage.getItem('reviewProblem');
        if (targetDifficulty && DIFFICULTY_LEVELS[targetDifficulty]) {
            setSelectedDifficulty(targetDifficulty);
            setCurrentView('training');
        }
        else if (reviewProblem) {
            // If there's a review problem, extract difficulty and go to training
            const problemData = JSON.parse(reviewProblem);
            if (problemData.difficultyLevel && DIFFICULTY_LEVELS[problemData.difficultyLevel]) {
                setSelectedDifficulty(problemData.difficultyLevel);
                setCurrentView('training');
            }
        }
    }, [location]);
    const handleDifficultySelect = (difficulty) => {
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
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [currentView === 'difficulty' && (_jsxs("div", { className: "fixed top-4 right-4 z-50 flex items-center gap-2", children: [isAdmin && (_jsx(Link, { href: "/admin", children: _jsxs(Button, { variant: "outline", size: "sm", className: "px-4 py-2 bg-white shadow-md rounded border-gray-300 hover:bg-gray-50 flex items-center", children: [_jsx(Shield, { className: "w-4 h-4 mr-2" }), "\u7BA1\u7406\u8005"] }) })), _jsx(Link, { href: "/my-page", children: _jsxs(Button, { variant: "outline", size: "sm", className: "px-4 py-2 bg-white shadow-md rounded border-gray-300 hover:bg-gray-50 flex items-center", children: [_jsx(User, { className: "w-4 h-4 mr-2" }), "\u30DE\u30A4\u30DA\u30FC\u30B8"] }) })] })), currentView === 'difficulty' && (_jsx(DifficultySelection, { onDifficultySelect: handleDifficultySelect })), currentView === 'training' && selectedDifficulty && (_jsx(TrainingInterface, { difficulty: selectedDifficulty, onBack: handleBackToDifficulty, onShowPayment: handleShowPayment })), _jsx(PaymentModal, { isOpen: showPaymentModal, onClose: handleClosePayment })] }));
}
