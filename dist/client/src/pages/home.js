"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const react_1 = require("react");
const wouter_1 = require("wouter");
const difficulty_selection_1 = require("@/components/difficulty-selection");
const training_interface_1 = require("@/components/training-interface");
const payment_modal_1 = require("@/components/payment-modal");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const constants_1 = require("@/lib/constants");
const react_query_1 = require("@tanstack/react-query");
const auth_provider_1 = require("@/components/auth-provider");
function Home() {
    const [location] = (0, wouter_1.useLocation)();
    const [currentView, setCurrentView] = (0, react_1.useState)('difficulty');
    const [selectedDifficulty, setSelectedDifficulty] = (0, react_1.useState)(null);
    const [showPaymentModal, setShowPaymentModal] = (0, react_1.useState)(false);
    const { isAdmin } = (0, auth_provider_1.useAuth)();
    // Check subscription status
    const { data: userSubscription } = (0, react_query_1.useQuery)({
        queryKey: ["/api/user-subscription"],
    });
    // Handle URL query parameters and path parameters for difficulty selection
    (0, react_1.useEffect)(() => {
        const urlParams = new URLSearchParams(location.split('?')[1] || '');
        const difficulty = urlParams.get('difficulty');
        // Check for difficulty in URL path (e.g., /chat/toeic or /practice/toeic)
        const pathMatch = location.match(/\/(chat|practice)\/(.+)/);
        const pathDifficulty = pathMatch ? pathMatch[2] : null;
        const targetDifficulty = difficulty || pathDifficulty;
        // Check for review problem in sessionStorage
        const reviewProblem = sessionStorage.getItem('reviewProblem');
        if (targetDifficulty && constants_1.DIFFICULTY_LEVELS[targetDifficulty]) {
            setSelectedDifficulty(targetDifficulty);
            setCurrentView('training');
        }
        else if (reviewProblem) {
            // If there's a review problem, extract difficulty and go to training
            const problemData = JSON.parse(reviewProblem);
            if (problemData.difficultyLevel && constants_1.DIFFICULTY_LEVELS[problemData.difficultyLevel]) {
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
    return (<div className="min-h-screen bg-gray-50">
      {/* Navigation header - only show on difficulty selection */}
      {currentView === 'difficulty' && (<div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {isAdmin && (<wouter_1.Link href="/admin">
              <button_1.Button variant="outline" size="sm" className="px-4 py-2 bg-white shadow-md rounded border-gray-300 hover:bg-gray-50 flex items-center">
                <lucide_react_1.Shield className="w-4 h-4 mr-2"/>
                管理者
              </button_1.Button>
            </wouter_1.Link>)}
          <wouter_1.Link href="/my-page">
            <button_1.Button variant="outline" size="sm" className="px-4 py-2 bg-white shadow-md rounded border-gray-300 hover:bg-gray-50 flex items-center">
              <lucide_react_1.User className="w-4 h-4 mr-2"/>
              マイページ
            </button_1.Button>
          </wouter_1.Link>
        </div>)}

      {currentView === 'difficulty' && (<difficulty_selection_1.DifficultySelection onDifficultySelect={handleDifficultySelect}/>)}
      
      {currentView === 'training' && selectedDifficulty && (<training_interface_1.TrainingInterface difficulty={selectedDifficulty} onBack={handleBackToDifficulty} onShowPayment={handleShowPayment}/>)}
      
      <payment_modal_1.PaymentModal isOpen={showPaymentModal} onClose={handleClosePayment}/>
    </div>);
}
