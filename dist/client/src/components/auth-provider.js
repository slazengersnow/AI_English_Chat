"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = useAuth;
exports.AuthProvider = AuthProvider;
const react_1 = require("react");
const useAuth_1 = require("@/hooks/useAuth");
const AuthContext = (0, react_1.createContext)(undefined);
function useAuth() {
    const context = (0, react_1.useContext)(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
function AuthProvider({ children }) {
    const authState = (0, useAuth_1.useAuthState)();
    return (<AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>);
}
