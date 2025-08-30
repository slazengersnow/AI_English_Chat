import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '../../../shared/supabase'
import { Mail } from 'lucide-react'

export default function DebugEmail() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const { toast } = useToast()

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
      const currentOrigin = window.location.origin
      const redirectUrl = `${currentOrigin}/reset-password`
      
      console.log('Testing password reset with:', {
        email,
        redirectUrl,
        origin: currentOrigin
      })

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      const debugResult = {
        email,
        redirectUrl,
        origin: currentOrigin,
        data: data || null,
        error: error || null,
        timestamp: new Date().toISOString()
      }

      setDebugInfo(JSON.stringify(debugResult, null, 2))
      console.log('Password reset debug result:', debugResult)

      if (error) {
        console.error('Password reset error:', error)
        toast({
          title: "パスワードリセットエラー",
          description: `エラー: ${error.message}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "パスワードリセットメール送信完了",
          description: "メール送信処理が完了しました。デバッグ情報を確認してください。",
        })
      }
    } catch (error) {
      console.error('Password reset exception:', error)
      toast({
        title: "エラー",
        description: "パスワードリセット中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      console.log('Supabase connection test:', { data, error })
      
      const connectionInfo = {
        hasSession: !!data.session,
        user: data.session?.user?.email || null,
        error: error || null,
        timestamp: new Date().toISOString()
      }
      
      setDebugInfo(JSON.stringify(connectionInfo, null, 2))
      
      toast({
        title: "Supabase接続テスト完了",
        description: "結果をデバッグ情報で確認してください",
      })
    } catch (error) {
      console.error('Supabase connection test error:', error)
      toast({
        title: "接続テストエラー",
        description: "Supabaseへの接続テストに失敗しました",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">メール送信デバッグ</CardTitle>
          <CardDescription>
            パスワードリセットメールの送信をテストします
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
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

          <div className="space-y-2">
            <Button 
              onClick={testPasswordReset} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "送信テスト中..." : "パスワードリセットメール送信テスト"}
            </Button>
            
            <Button 
              onClick={testSupabaseConnection} 
              variant="outline"
              className="w-full"
            >
              Supabase接続テスト
            </Button>
          </div>

          {debugInfo && (
            <div className="space-y-2">
              <Label>デバッグ情報</Label>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                {debugInfo}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}