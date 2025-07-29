import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@shared/supabase'

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Auth - Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Auth - Initial session result:', { session: !!session, user: !!session?.user, error })
        setUser(session?.user ?? null)
        setIsLoading(false)
      } catch (error) {
        console.error('Auth - Error getting initial session:', error)
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth - State change:', { event, session: !!session, user: !!session?.user })
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const isAuthenticated = !!user
  const isAdmin = user?.email === 'slazengersnow@gmail.com'

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    signOut,
  }
}