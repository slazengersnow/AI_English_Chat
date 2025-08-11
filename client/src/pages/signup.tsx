import { useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabaseClient'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'

export default function Signup() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "パスワードは8文字以上である必要があります"
    }
    if (!/[A-Za-z]/.test(password)) {
      return "パスワードに英字を含めてください"
    }
    if (!/[0-9]/.test(password)) {
      return "パスワードに数字を含めてください"
    }
    return null
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // バリデーション
    if (!agreedToTerms || !agreedToPrivacy) {
      toast({
        title: "登録エラー",
        description: "利用規約とプライバシーポリシーに同意してください",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "登録エラー",
        description: "パスワードが一致しません",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      toast({
        title: "パスワードエラー",
        description: passwordError,
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      console.debug('signup payload', { email, password: '***' })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      console.log('Supabase signup response:', { 
        data: data ? { 
          user: data.user ? { 
            id: data.user.id, 
            email: data.user.email, 
            confirmed: !!data.user.email_confirmed_at 
          } : null,
          session: !!data.session
        } : null, 
        error: error ? { message: error.message, status: error.status } : null 
      })

      if (error) {
        console.error('signup error', error)
        toast({
          title: "登録エラー",
          description: error.message === 'User already registered' ? 
            "このメールアドレスは既に登録されています" : 
            error.message,
          variant: "destructive",
        })
        return
      }

      if (data.user) {
        console.log('Signup successful, checking session...')
        
        // Check if user is immediately logged in (email confirmation disabled)
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('Current session after signup:', !!sessionData.session)
        
        if (sessionData.session) {
          // User is immediately logged in
          toast({
            title: "登録・ログイン完了",
            description: "アカウントが作成されました。メインページに移動します。",
          })
          setTimeout(() => {
            window.location.href = '/'
          }, 1500)
        } else if (!data.user.email_confirmed_at) {
          // Email confirmation required
          toast({
            title: "登録完了",
            description: "確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。",
          })
          setLocation('/login')
        } else {
          // Pre-confirmed account
          toast({
            title: "登録完了",
            description: "アカウントが作成されました。ログインしてください。",
          })
          setLocation('/login')
        }
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "登録中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`
      console.log('🔧 FIXED Google OAuth signup with redirect to:', redirectUrl)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      console.log('OAuth signup response:', { data, error })

      if (error) {
        console.error('Google OAuth signup error:', error)
        toast({
          title: "Google登録エラー",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Google OAuth signup exception:', error)
      toast({
        title: "エラー",
        description: "Google登録中にエラーが発生しました",
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
            新しいアカウントを作成してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
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
                  placeholder="最低8文字、英字と数字を含む"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード確認</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="パスワードを再入力"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  <a href="/terms" target="_blank" className="text-blue-600 hover:underline">利用規約</a>に同意します
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacy"
                  checked={agreedToPrivacy}
                  onCheckedChange={(checked) => setAgreedToPrivacy(checked as boolean)}
                />
                <Label htmlFor="privacy" className="text-sm">
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">プライバシーポリシー</a>に同意します
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登録中..." : "アカウント作成"}
            </Button>
          </form>

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
              onClick={handleGoogleSignup}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Googleで登録
            </Button>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">既にアカウントをお持ちの方は</span>
            <Button
              variant="link"
              className="p-0 ml-1 h-auto"
              onClick={() => setLocation('/login')}
            >
              ログイン
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}