import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/auth-provider'
import { useLocation } from 'wouter'

export function UserProfile() {
  const { user, isAdmin, signOut } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      toast({
        title: "ログアウト完了",
        description: "正常にログアウトしました",
      })
      setLocation('/')
    } catch (error) {
      toast({
        title: "ログアウトエラー",
        description: "ログアウト中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!user) return null

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <Avatar className="w-16 h-16 mx-auto">
          <AvatarImage src={user.user_metadata?.avatar_url} />
          <AvatarFallback>
            <User className="w-8 h-8" />
          </AvatarFallback>
        </Avatar>
        <CardTitle className="flex items-center justify-center gap-2">
          {user.email}
          {isAdmin && <Shield className="w-4 h-4 text-orange-500" />}
        </CardTitle>
        <CardDescription>
          {isAdmin ? '管理者アカウント' : 'ユーザーアカウント'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>登録日: {new Date(user.created_at).toLocaleDateString('ja-JP')}</p>
            {user.email_confirmed_at && (
              <p>認証済み: {new Date(user.email_confirmed_at).toLocaleDateString('ja-JP')}</p>
            )}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}