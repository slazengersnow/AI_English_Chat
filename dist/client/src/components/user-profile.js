"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfile = UserProfile;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const avatar_1 = require("@/components/ui/avatar");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/hooks/use-toast");
const auth_provider_1 = require("@/components/auth-provider");
const wouter_1 = require("wouter");
function UserProfile() {
    const { user, isAdmin, signOut } = (0, auth_provider_1.useAuth)();
    const [, setLocation] = (0, wouter_1.useLocation)();
    const { toast } = (0, use_toast_1.useToast)();
    const [isLoggingOut, setIsLoggingOut] = (0, react_1.useState)(false);
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
    return (<card_1.Card className="w-full max-w-md mx-auto">
      <card_1.CardHeader className="text-center">
        <avatar_1.Avatar className="w-16 h-16 mx-auto">
          <avatar_1.AvatarImage src={user.user_metadata?.avatar_url}/>
          <avatar_1.AvatarFallback>
            <lucide_react_1.User className="w-8 h-8"/>
          </avatar_1.AvatarFallback>
        </avatar_1.Avatar>
        <card_1.CardTitle className="flex items-center justify-center gap-2">
          {user.email}
          {isAdmin && <lucide_react_1.Shield className="w-4 h-4 text-orange-500"/>}
        </card_1.CardTitle>
        <card_1.CardDescription>
          {isAdmin ? '管理者アカウント' : 'ユーザーアカウント'}
        </card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>登録日: {new Date(user.created_at).toLocaleDateString('ja-JP')}</p>
            {user.email_confirmed_at && (<p>認証済み: {new Date(user.email_confirmed_at).toLocaleDateString('ja-JP')}</p>)}
          </div>
          
          <button_1.Button variant="outline" className="w-full" onClick={handleLogout} disabled={isLoggingOut}>
            <lucide_react_1.LogOut className="w-4 h-4 mr-2"/>
            {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
          </button_1.Button>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
