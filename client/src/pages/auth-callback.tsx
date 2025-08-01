import React, { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '@shared/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const [, setLocation] = useLocation()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLの#部分とクエリパラメータの両方をチェック
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const queryParams = new URLSearchParams(window.location.search)
        
        // トークンとタイプを取得
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token')
        const type = hashParams.get('type') || queryParams.get('type')
        const error = hashParams.get('error') || queryParams.get('error')
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description')

        console.log('Auth callback parameters:', {
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
          type,
          error,
          errorDescription,
          hash: window.location.hash,
          search: window.location.search
        })

        if (error) {
          setStatus('error')
          setMessage(errorDescription || error)
          return
        }

        if (type === 'signup' && accessToken) {
          // メール確認の場合
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            setStatus('error')
            setMessage('認証セッションの設定に失敗しました')
            return
          }

          if (data.user) {
            console.log('User confirmed:', data.user.email)
            setStatus('success')
            setMessage(`メール認証が完了しました！ようこそ ${data.user.email}`)
            
            // 3秒後にログインページへリダイレクト
            setTimeout(() => {
              setLocation('/login')
            }, 3000)
          }
        } else if (type === 'recovery' && accessToken) {
          // パスワードリセットの場合
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })

          if (sessionError) {
            console.error('Recovery session error:', sessionError)
            setStatus('error')
            setMessage('パスワードリセットセッションの設定に失敗しました')
            return
          }

          setStatus('success')
          setMessage('パスワードリセット認証が完了しました。新しいパスワードを設定してください。')
          
          // パスワード変更ページへリダイレクト
          setTimeout(() => {
            setLocation('/change-password')
          }, 2000)
        } else {
          // 通常の認証の場合
          const { data, error: authError } = await supabase.auth.getSession()
          
          if (authError) {
            console.error('Auth error:', authError)
            setStatus('error')
            setMessage('認証の確認に失敗しました')
            return
          }

          if (data.session) {
            setStatus('success')
            setMessage('認証が完了しました！')
            setTimeout(() => {
              setLocation('/')
            }, 2000)
          } else {
            setStatus('error')
            setMessage('認証情報が見つかりません')
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage('認証処理中にエラーが発生しました')
      }
    }

    handleAuthCallback()
  }, [setLocation])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            {status === 'loading' && <Loader2 className="w-8 h-8 text-white animate-spin" />}
            {status === 'success' && <CheckCircle className="w-8 h-8 text-white" />}
            {status === 'error' && <XCircle className="w-8 h-8 text-white" />}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && '認証処理中...'}
            {status === 'success' && '認証完了'}
            {status === 'error' && '認証エラー'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className={`text-lg ${status === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
            {message}
          </p>
          
          {status === 'error' && (
            <div className="space-y-2">
              <Button 
                onClick={() => setLocation('/login')} 
                className="w-full"
              >
                ログインページに戻る
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                再試行
              </Button>
            </div>
          )}
          
          {status === 'success' && (
            <p className="text-sm text-gray-500">
              自動的にリダイレクトされます...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}