import { useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@shared/supabase'
import { useAuth } from '@/components/auth-provider'
import { Mail, Lock, Eye, EyeOff, TestTube } from 'lucide-react'

export default function Login() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const auth = useAuth()
  const [email, setEmail] = useState('slazengersnow@gmail.com')
  const [password, setPassword] = useState('s05936623')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Login error:', error);
        toast({
          title: "ログインエラー",
          description: error.message === 'Invalid login credentials' ? 
            "メールアドレスまたはパスワードが正しくありません。デモモードをお試しください。" : 
            error.message,
          variant: "destructive",
        })
        return
      }

      if (data.user) {
        toast({
          title: "ログイン成功",
          description: "AI英作文チャットへようこそ！",
        })
        // Add a small delay to ensure the toast is visible before redirect
        setTimeout(() => {
          setLocation('/')
        }, 1000)
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "ログイン中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoMode = () => {
    auth.enableDemoMode();
    toast({
      title: "デモモード開始",
      description: "デモ用管理者アカウントでログインしました",
    });
    setTimeout(() => {
      setLocation('/');
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    try {
      const replitUrl = `https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app/auth/callback`
      console.log('Starting Google OAuth with redirect to:', replitUrl)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: replitUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      console.log('OAuth response:', { data, error })

      if (error) {
        console.error('Google OAuth error:', error)
        toast({
          title: "Googleログインエラー",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Google OAuth exception:', error)
      toast({
        title: "エラー",
        description: "Googleログイン中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: "メールアドレスが必要です",
        description: "パスワードリセットにはメールアドレスを入力してください",
        variant: "destructive",
      })
      return
    }

    try {
      // Try different configurations to identify the issue
      const configurations = [
        {
          name: "標準設定",
          config: {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        },
        {
          name: "captchaオプション無し",
          config: {
            redirectTo: `${window.location.origin}/reset-password`,
            options: {
              captchaToken: null
            }
          }
        },
        {
          name: "HTTPSリダイレクト",
          config: {
            redirectTo: `https://${window.location.host}/reset-password`,
          }
        }
      ]

      console.log('Starting password reset attempts for:', email)
      
      for (const { name, config } of configurations) {
        console.log(`Attempting ${name} configuration:`, config)
        
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, config)
        
        console.log(`${name} result:`, { data, error })
        
        if (!error) {
          toast({
            title: "パスワードリセットメール送信完了",
            description: `${name}での送信が成功しました。メールをご確認ください。`,
          })
          return // Success, stop trying other configurations
        }
        
        // Wait a bit to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // If we get here, all configurations failed
      toast({
        title: "パスワードリセットエラー",
        description: "すべての設定で送信に失敗しました。詳細はコンソールをご確認ください。",
        variant: "destructive",
      })
      
    } catch (error) {
      console.error('Password reset exception:', error)
      toast({
        title: "エラー",
        description: "パスワードリセット中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <CardTitle className="text-2xl">AI瞬間英作文チャット</CardTitle>
          <CardDescription>
            アカウントにログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
          
          <div className="mt-2 text-center">
            <Button
              variant="link"
              className="text-sm text-gray-600 hover:text-gray-800"
              onClick={() => handlePasswordReset()}
            >
              パスワードをお忘れですか？
            </Button>
          </div>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">または</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleLogin}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Googleでログイン
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2 bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
              onClick={handleDemoMode}
            >
              <TestTube className="w-4 h-4 mr-2" />
              デモモード（認証不要）
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-4">
              デモモード：Supabase認証エラーをバイパスして<br />
              アプリケーション機能をテストできます
            </p>
            <div className="text-sm">
              <span className="text-gray-600">アカウントをお持ちでない方は</span>
              <Button
                variant="link"
                className="p-0 ml-1 h-auto"
                onClick={() => setLocation('/signup')}
              >
                新規登録
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}