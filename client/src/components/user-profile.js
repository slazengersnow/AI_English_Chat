import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { useLocation } from 'wouter';
export function UserProfile() {
    const { user, isAdmin, signOut } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            toast({
                title: "ログアウト完了",
                description: "正常にログアウトしました",
            });
            setLocation('/');
        }
        catch (error) {
            toast({
                title: "ログアウトエラー",
                description: "ログアウト中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoggingOut(false);
        }
    };
    if (!user)
        return null;
    return (_jsxs(Card, { className: "w-full max-w-md mx-auto", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsxs(Avatar, { className: "w-16 h-16 mx-auto", children: [_jsx(AvatarImage, { src: user.user_metadata?.avatar_url }), _jsx(AvatarFallback, { children: _jsx(User, { className: "w-8 h-8" }) })] }), _jsxs(CardTitle, { className: "flex items-center justify-center gap-2", children: [user.email, isAdmin && _jsx(Shield, { className: "w-4 h-4 text-orange-500" })] }), _jsx(CardDescription, { children: isAdmin ? '管理者アカウント' : 'ユーザーアカウント' })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "text-sm text-gray-600", children: [_jsxs("p", { children: ["\u767B\u9332\u65E5: ", new Date(user.created_at).toLocaleDateString('ja-JP')] }), user.email_confirmed_at && (_jsxs("p", { children: ["\u8A8D\u8A3C\u6E08\u307F: ", new Date(user.email_confirmed_at).toLocaleDateString('ja-JP')] }))] }), _jsxs(Button, { variant: "outline", className: "w-full", onClick: handleLogout, disabled: isLoggingOut, children: [_jsx(LogOut, { className: "w-4 h-4 mr-2" }), isLoggingOut ? 'ログアウト中...' : 'ログアウト'] })] }) })] }));
}
