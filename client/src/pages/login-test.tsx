import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@shared/supabase'

export default function LoginTest() {
  const { toast } = useToast()
  const [email, setEmail] = useState('slazengersnow1@gmail.com')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authUser, setAuthUser] = useState(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('Testing login with:', { email, password: '***' })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Login response:', { data, error })

      if (error) {
        toast({
          title: "ログインエラー",
          description: `エラー: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      if (data.user) {
        setAuthUser(data.user)
        toast({
          title: "ログイン成功",
          description: `ようこそ ${data.user.email}さん！`,
        })
      }
    } catch (error) {
      console.error('Login exception:', error)
      toast({
        title: "エラー",
        description: "ログイン中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('Current user:', { user, error })
      
      if (user) {
        setAuthUser(user)
        toast({
          title: "現在のユーザー",
          description: `ログイン中: ${user.email}`,
        })
      } else {
        toast({
          title: "認証状態",
          description: "ユーザーはログインしていません",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Get user error:', error)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
      } else {
        setAuthUser(null)
        toast({
          title: "ログアウト完了",
          description: "正常にログアウトしました",
        })
      }
    } catch (error) {
      console.error('Logout exception:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ログインテスト</CardTitle>
          <CardDescription>
            slazengersnow1@gmail.com でのログインテスト
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "ログイン中..." : "ログインテスト"}
            </Button>
          </form>
          
          <div className="space-y-2">
            <Button onClick={checkCurrentUser} variant="outline" className="w-full">
              現在のユーザー確認
            </Button>
            
            {authUser && (
              <Button onClick={handleLogout} variant="destructive" className="w-full">
                ログアウト
              </Button>
            )}
          </div>
          
          {authUser && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800">認証成功</h3>
              <p className="text-sm text-green-600">
                ユーザー: {authUser.email}
              </p>
              <p className="text-sm text-green-600">
                ID: {authUser.id}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}