import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChatInterface } from "@/components/chat-interface";
import { AffiliateModal } from "@/components/affiliate-modal";
import type { ThemeKey } from "@/lib/constants";

export default function Chat() {
  const [, navigate] = useLocation();
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey | null>(null);
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);

  // Get theme from URL parameters or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme') as ThemeKey;
    
    if (themeParam) {
      setSelectedTheme(themeParam);
    } else {
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
    return (
      <div className="min-h-screen bg-bg-gray flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-line-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-text">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ChatInterface 
        theme={selectedTheme}
        onBack={handleBackToThemes}
        onShowAffiliate={handleShowAffiliate}
      />
      
      <AffiliateModal 
        isOpen={showAffiliateModal}
        onClose={handleCloseAffiliate}
      />
    </>
  );
}
