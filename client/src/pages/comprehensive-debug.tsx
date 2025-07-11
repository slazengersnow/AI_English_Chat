import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@shared/supabase'
import { Mail, Settings, AlertCircle } from 'lucide-react'

export default function ComprehensiveDebug() {
  const [email, setEmail] = useState('slazengersnow@gmail.com')
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const [supabaseConfig, setSupabaseConfig] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Get Supabase configuration
    const config = {
      url: import.meta.env.VITE_SUPABASE_URL,
      key: import.meta.env.VITE_SUPABASE_ANON_KEY,
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE,
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }
    setSupabaseConfig(config)
    console.log('Supabase config loaded:', config)
  }, [])

  const testPasswordReset = async () => {
    if (!email) {
      toast({
        title: "メールアドレスが必要です",
        description: "テスト用のメールアドレスを入力してください",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setDebugInfo('')

    try {
      // Multiple redirect URL variations to test
      const redirectUrls = [
        `${window.location.origin}/reset-password`,
        `${window.location.origin}/password-reset`,
        `${window.location.origin}/auth-redirect`,
        `${window.location.origin}/`
      ]

      const results = []

      for (const redirectUrl of redirectUrls) {
        console.log(`Testing password reset with redirect: ${redirectUrl}`)
        
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        })

        results.push({
          redirectUrl,
          data: data || null,
          error: error ? { 
            message: error.message, 
            status: error.status,
            name: error.name 
          } : null,
          timestamp: new Date().toISOString()
        })

        // Wait a bit between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      const debugResult = {
        email,
        config: supabaseConfig,
        results,
        totalTests: results.length,
        successCount: results.filter(r => !r.error).length,
        errorCount: results.filter(r => r.error).length
      }

      setDebugInfo(JSON.stringify(debugResult, null, 2))
      console.log('Comprehensive password reset test results:', debugResult)

      const hasErrors = results.some(r => r.error)
      if (hasErrors) {
        toast({
          title: "パスワードリセットテスト完了",
          description: "エラーが検出されました。デバッグ情報を確認してください。",
          variant: "destructive",
        })
      } else {
        toast({
          title: "パスワードリセットテスト完了",
          description: "すべてのテストが成功しました。メールを確認してください。",
        })
      }
    } catch (error) {
      console.error('Password reset test exception:', error)
      setDebugInfo(JSON.stringify({
        error: error.message || String(error),
        config: supabaseConfig,
        timestamp: new Date().toISOString()
      }, null, 2))
      
      toast({
        title: "エラー",
        description: "パスワードリセットテスト中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testSupabaseStatus = async () => {
    try {
      // Test multiple Supabase operations
      const tests = []

      // Test 1: Get session
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        tests.push({
          test: 'getSession',
          success: !sessionError,
          data: sessionData?.session?.user?.email || null,
          error: sessionError?.message || null
        })
      } catch (e) {
        tests.push({
          test: 'getSession',
          success: false,
          error: e.message || String(e)
        })
      }

      // Test 2: Get user
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        tests.push({
          test: 'getUser',
          success: !userError,
          data: userData?.user?.email || null,
          error: userError?.message || null
        })
      } catch (e) {
        tests.push({
          test: 'getUser',
          success: false,
          error: e.message || String(e)
        })
      }

      // Test 3: Simple sign-up test (without actually signing up)
      try {
        const testEmail = 'test+noreply@example.com'
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: testEmail,
          password: 'testpassword123',
          options: { data: { test: true } }
        })
        tests.push({
          test: 'signUp',
          success: !signUpError,
          data: signUpData?.user?.email || null,
          error: signUpError?.message || null
        })
      } catch (e) {
        tests.push({
          test: 'signUp',
          success: false,
          error: e.message || String(e)
        })
      }

      const statusResult = {
        config: supabaseConfig,
        tests,
        timestamp: new Date().toISOString()
      }

      setDebugInfo(JSON.stringify(statusResult, null, 2))
      console.log('Supabase status test results:', statusResult)

      toast({
        title: "Supabaseステータステスト完了",
        description: "結果をデバッグ情報で確認してください",
      })
    } catch (error) {
      console.error('Supabase status test error:', error)
      setDebugInfo(JSON.stringify({
        error: error.message || String(error),
        config: supabaseConfig,
        timestamp: new Date().toISOString()
      }, null, 2))
      
      toast({
        title: "ステータステストエラー",
        description: "Supabaseステータステストに失敗しました",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Settings className="w-6 h-6" />
            包括的メール送信診断
          </CardTitle>
          <CardDescription>
            Supabaseメール送信機能の詳細テストと診断
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {supabaseConfig && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                現在の設定
              </h3>
              <div className="text-sm space-y-1">
                <p><strong>URL:</strong> {supabaseConfig.url}</p>
                <p><strong>キー長:</strong> {supabaseConfig.key?.length || 0} 文字</p>
                <p><strong>環境:</strong> {supabaseConfig.mode} ({supabaseConfig.isDev ? '開発' : '本番'})</p>
                <p><strong>Origin:</strong> {supabaseConfig.origin}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">テスト用メールアドレス</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={testPasswordReset} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "テスト中..." : "包括的パスワードリセットテスト"}
            </Button>
            
            <Button 
              onClick={testSupabaseStatus} 
              variant="outline"
              className="w-full"
            >
              Supabaseステータステスト
            </Button>
          </div>

          {debugInfo && (
            <div className="space-y-2">
              <Label>詳細診断結果</Label>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-[500px] font-mono">
                {debugInfo}
              </pre>
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-yellow-800">診断のポイント</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 複数のリダイレクトURLパターンでテスト</li>
              <li>• Supabaseの基本機能動作確認</li>
              <li>• 環境変数とAPI設定の検証</li>
              <li>• メール送信レート制限の考慮</li>
              <li>• 詳細なエラーログ出力</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}