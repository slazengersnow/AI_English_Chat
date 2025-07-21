import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
export default function TestHash() {
    const [currentHash, setCurrentHash] = useState('');
    const [storedHash, setStoredHash] = useState('');
    useEffect(() => {
        const updateHashInfo = () => {
            setCurrentHash(window.location.hash);
            setStoredHash(sessionStorage.getItem('supabase_recovery_hash') || 'none');
        };
        updateHashInfo();
        window.addEventListener('hashchange', updateHashInfo);
        return () => window.removeEventListener('hashchange', updateHashInfo);
    }, []);
    const simulatePasswordReset = () => {
        // Simulate a Supabase password reset hash
        const testHash = '#access_token=test_token_123&type=recovery&refresh_token=test_refresh_123';
        window.location.hash = testHash;
        console.log('Simulated password reset hash:', testHash);
    };
    const clearHash = () => {
        window.location.hash = '';
        sessionStorage.removeItem('supabase_recovery_hash');
        setCurrentHash('');
        setStoredHash('none');
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Hash Handler Test" }), _jsx(CardDescription, { children: "Test the hash fragment detection functionality" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "Current Hash:" }), _jsx("p", { className: "text-xs text-gray-600 break-all", children: currentHash || 'none' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "Stored Hash:" }), _jsx("p", { className: "text-xs text-gray-600 break-all", children: storedHash })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Button, { onClick: simulatePasswordReset, className: "w-full", children: "Simulate Password Reset Hash" }), _jsx(Button, { onClick: clearHash, variant: "outline", className: "w-full", children: "Clear Hash" })] }), _jsx("div", { className: "text-xs text-gray-500", children: "Check the browser console for HashHandler logs" })] })] }) }));
}
