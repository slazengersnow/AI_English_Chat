import { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient.js'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  initialized: boolean
  demoMode: boolean
  signOut: () => Promise<void>
  enableDemoMode: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session取得エラー:', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)

          // 管理者権限チェック
          if (session?.user) {
            await checkAdminStatus(session.user)
          }
        }
      } catch (error) {
        console.error('初期認証チェックエラー:', error)
      } finally {
        setIsLoading(false)
        setInitialized(true)
      }
    }

    getInitialSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await checkAdminStatus(session.user)
        } else {
          setIsAdmin(false)
        }

        if (event === 'SIGNED_OUT') {
          setDemoMode(false)
        }

        setIsLoading(false)
        setInitialized(true)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // 管理者権限チェック
  const checkAdminStatus = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.log('管理者権限チェックエラー:', error)
        setIsAdmin(false)
      } else {
        setIsAdmin(data?.role === 'admin')
      }
    } catch (error) {
      console.error('管理者権限チェック失敗:', error)
      setIsAdmin(false)
    }
  }

  // サインアウト
  const signOut = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('サインアウトエラー:', error)
      }
      setDemoMode(false)
    } catch (error) {
      console.error('サインアウト失敗:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // デモモード有効化
  const enableDemoMode = () => {
    setDemoMode(true)
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user || demoMode,
    isAdmin,
    initialized,
    demoMode,
    signOut,
    enableDemoMode,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}