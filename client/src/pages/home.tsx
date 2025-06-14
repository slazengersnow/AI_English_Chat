import { useState } from "react";
import { ThemeSelection } from "@/components/theme-selection";
import { ChatInterface } from "@/components/chat-interface";
import { AffiliateModal } from "@/components/affiliate-modal";
import type { ThemeKey } from "@/lib/constants";

export default function Home() {
  const [currentView, setCurrentView] = useState<'theme' | 'chat'>('theme');
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey | null>(null);
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);

  const handleThemeSelect = (theme: ThemeKey) => {
    setSelectedTheme(theme);
    setCurrentView('chat');
  };

  const handleBackToThemes = () => {
    setCurrentView('theme');
    setSelectedTheme(null);
    setShowAffiliateModal(false);
  };

  const handleShowAffiliate = () => {
    setShowAffiliateModal(true);
  };

  const handleCloseAffiliate = () => {
    setShowAffiliateModal(false);
  };

  return (
    <>
      {currentView === 'theme' && (
        <ThemeSelection onThemeSelect={handleThemeSelect} />
      )}
      
      {currentView === 'chat' && selectedTheme && (
        <ChatInterface 
          theme={selectedTheme}
          onBack={handleBackToThemes}
          onShowAffiliate={handleShowAffiliate}
        />
      )}
      
      <AffiliateModal 
        isOpen={showAffiliateModal}
        onClose={handleCloseAffiliate}
      />
    </>
  );
}
