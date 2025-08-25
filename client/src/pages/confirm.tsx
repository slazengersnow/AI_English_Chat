import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Confirm() {
  const [, setLocation] = useLocation()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus('error')
          setMessage('メールアドレスの確認中にエラーが発生しました。')
          return
        }

        if (data.session) {
          setStatus('success')
          setMessage('メールアドレス認証が完了しました。')
          
          // 認証成功後、料金プラン選択ページにリダイレクト
          setTimeout(() => {
            setLocation('/subscription-select')
          }, 2000)
        } else {
          setStatus('error')
          setMessage('認証セッションが見つかりません。')
        }
      } catch (error) {
        setStatus('error')
        setMessage('認証処理中にエラーが発生しました。')
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <CardTitle className="text-2xl">AI瞬間英作文チャット</CardTitle>
          <CardDescription>
            メールアドレス認証
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-600">認証を確認中...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold text-green-700">認証完了</h3>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">
                ログインしてAI英作文チャットをお楽しみください。
              </p>
              <Button 
                onClick={() => setLocation('/login')}
                className="w-full"
              >
                ログインページへ
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold text-red-700">認証エラー</h3>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">
                新しい確認メールを送信するか、サポートにお問い合わせください。
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => setLocation('/signup')}
                  className="w-full"
                >
                  アカウント作成に戻る
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/login')}
                  className="w-full"
                >
                  ログインページへ
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}