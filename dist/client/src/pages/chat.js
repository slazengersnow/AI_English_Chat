"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Chat;
const react_1 = require("react");
const wouter_1 = require("wouter");
const chat_interface_1 = require("@/components/chat-interface");
const affiliate_modal_1 = require("@/components/affiliate-modal");
function Chat() {
    const [, navigate] = (0, wouter_1.useLocation)();
    const [selectedTheme, setSelectedTheme] = (0, react_1.useState)(null);
    const [showAffiliateModal, setShowAffiliateModal] = (0, react_1.useState)(false);
    // Get theme from URL parameters or localStorage
    (0, react_1.useEffect)(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const themeParam = urlParams.get('theme');
        if (themeParam) {
            setSelectedTheme(themeParam);
        }
        else {
            // If no theme in URL, redirect to home
            navigate('/');
        }
    }, [navigate]);
    const handleBackToThemes = () => {
        navigate('/');
    };
    const handleShowAffiliate = () => {
        setShowAffiliateModal(true);
    };
    const handleCloseAffiliate = () => {
        setShowAffiliateModal(false);
    };
    if (!selectedTheme) {
        return (<div className="min-h-screen bg-bg-gray flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-line-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-text">読み込み中...</p>
        </div>
      </div>);
    }
    return (<>
      <chat_interface_1.ChatInterface theme={selectedTheme} onBack={handleBackToThemes} onShowAffiliate={handleShowAffiliate}/>
      
      <affiliate_modal_1.AffiliateModal isOpen={showAffiliateModal} onClose={handleCloseAffiliate}/>
    </>);
}
