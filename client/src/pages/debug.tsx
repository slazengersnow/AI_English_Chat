import { useEffect, useState } from 'react'
import { supabase } from '@shared/supabase'
import { User } from '@supabase/supabase-js'

export default function DebugPage() {
  const [authState, setAuthState] = useState<{
    user: User | null
    session: any
    loading: boolean
    error: string | null
  }>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  const [loginForm, setLoginForm] = useState({
    email: 'slazengersnow1@gmail.com',
    password: 's05936623'
  })

  const [loginResult, setLoginResult] = useState<string | null>(null)

  useEffect(() => {
    console.log('Debug - Starting auth check...')
    
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Debug - Session check:', { session: !!session, user: !!session?.user, error })
        
        setAuthState({
          user: session?.user || null,
          session,
          loading: false,
          error: error?.message || null
        })
      } catch (err) {
        console.error('Debug - Auth check error:', err)
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Debug - Auth state change:', { event, session: !!session })
        setAuthState({
          user: session?.user || null,
          session,
          loading: false,
          error: null
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    console.log('Debug - Attempting login with:', loginForm.email)
    setLoginResult('ログイン中...')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      })

      console.log('Debug - Login result:', { data: !!data, user: !!data?.user, error })

      if (error) {
        setLoginResult(`エラー: ${error.message}`)
      } else if (data?.user) {
        setLoginResult('ログイン成功!')
      } else {
        setLoginResult('不明なエラー')
      }
    } catch (err) {
      console.error('Debug - Login error:', err)
      setLoginResult(`例外エラー: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">認証デバッグページ</h1>
        
        {/* 認証状態 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">認証状態</h2>
          <div className="space-y-2 text-sm">
            <div>ローディング: {authState.loading ? 'Yes' : 'No'}</div>
            <div>ユーザー: {authState.user ? 'あり' : 'なし'}</div>
            <div>セッション: {authState.session ? 'あり' : 'なし'}</div>
            <div>エラー: {authState.error || 'なし'}</div>
            {authState.user && (
              <div>
                <div>Email: {authState.user.email}</div>
                <div>ID: {authState.user.id}</div>
              </div>
            )}
          </div>
        </div>

        {/* ログインテスト */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">ログインテスト</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password:</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full p-2 border rounded"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              ログイン
            </button>
            {loginResult && (
              <div className="p-2 bg-gray-100 rounded text-sm">
                {loginResult}
              </div>
            )}
          </div>
        </div>

        {/* 環境変数チェック */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">環境変数</h2>
          <div className="space-y-1 text-sm">
            <div>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '設定済み' : '未設定'}</div>
            <div>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '設定済み' : '未設定'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}