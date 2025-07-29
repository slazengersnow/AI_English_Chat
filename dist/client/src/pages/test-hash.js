"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TestHash;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
function TestHash() {
    const [currentHash, setCurrentHash] = (0, react_1.useState)('');
    const [storedHash, setStoredHash] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
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
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <card_1.Card className="w-full max-w-md">
        <card_1.CardHeader>
          <card_1.CardTitle>Hash Handler Test</card_1.CardTitle>
          <card_1.CardDescription>
            Test the hash fragment detection functionality
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Current Hash:</p>
            <p className="text-xs text-gray-600 break-all">{currentHash || 'none'}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium">Stored Hash:</p>
            <p className="text-xs text-gray-600 break-all">{storedHash}</p>
          </div>
          
          <div className="space-y-2">
            <button_1.Button onClick={simulatePasswordReset} className="w-full">
              Simulate Password Reset Hash
            </button_1.Button>
            <button_1.Button onClick={clearHash} variant="outline" className="w-full">
              Clear Hash
            </button_1.Button>
          </div>
          
          <div className="text-xs text-gray-500">
            Check the browser console for HashHandler logs
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
