import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChatInterface } from "@/components/chat-interface";
import { AffiliateModal } from "@/components/affiliate-modal";
export default function Chat() {
    const [, navigate] = useLocation();
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [showAffiliateModal, setShowAffiliateModal] = useState(false);
    // Get theme from URL parameters or localStorage
    useEffect(() => {
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
        return (_jsx("div", { className: "min-h-screen bg-bg-gray flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-8 h-8 border-4 border-line-green border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-secondary-text", children: "\u8AAD\u307F\u8FBC\u307F\u4E2D..." })] }) }));
    }
    return (_jsxs(_Fragment, { children: [_jsx(ChatInterface, { theme: selectedTheme, onBack: handleBackToThemes, onShowAffiliate: handleShowAffiliate }), _jsx(AffiliateModal, { isOpen: showAffiliateModal, onClose: handleCloseAffiliate })] }));
}
