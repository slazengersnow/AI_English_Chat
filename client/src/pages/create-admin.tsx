import { useState } from 'react'
import { supabase } from '../../../shared/supabase'

export default function CreateAdmin() {
  const [email] = useState('slazengersnow@gmail.com')
  const [password] = useState('s05936623')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const createAdminAccount = async () => {
    setLoading(true)
    setMessage('管理者アカウントを作成中...')

    try {
      console.log('Creating admin account for:', email)

      // Step 1: Create user account
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            is_admin: true,
            role: 'admin'
          }
        }
      })

      if (signupError) {
        console.error('Signup error:', signupError)
        setMessage(`アカウント作成エラー: ${signupError.message}`)
        return
      }

      console.log('Admin account created:', signupData)

      // Step 2: Try to sign in immediately (if email confirmation is disabled)
      const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signinError) {
        console.log('Signin error (expected if email confirmation required):', signinError.message)
        setMessage(`管理者アカウント作成完了！メール認証が必要な場合があります。\nアカウント: ${email}\nパスワード: ${password}`)
      } else {
        console.log('Admin signed in successfully:', signinData)
        setMessage(`管理者アカウント作成・ログイン完了！\nアカウント: ${email}\nリダイレクト中...`)
        
        // Redirect to home page after successful login
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      }

    } catch (err) {
      console.error('Exception:', err)
      setMessage(`例外エラー: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    setMessage('既存管理者アカウントでログインテスト中...')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Login test error:', error)
        setMessage(`ログインエラー: ${error.message}`)
      } else {
        console.log('Login test successful:', data)
        setMessage('ログイン成功！リダイレクト中...')
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      }
    } catch (err) {
      console.error('Login test exception:', err)
      setMessage(`ログインテスト例外: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">管理者アカウント作成</h1>
          <p className="text-gray-600">AI瞬間英作文チャット</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              管理者メールアドレス
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={createAdminAccount}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '作成中...' : '管理者アカウント作成'}
          </button>

          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'テスト中...' : '既存アカウントでログインテスト'}
          </button>
        </div>

        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-700 whitespace-pre-line">{message}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            管理者アカウント: slazengersnow@gmail.com<br/>
            パスワード: s05936623
          </p>
        </div>
      </div>
    </div>
  )
}