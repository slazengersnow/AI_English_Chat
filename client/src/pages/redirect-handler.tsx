import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/providers/auth-provider'
import Login from './login'

export default function RedirectHandler() {
  const [, setLocation] = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    const handleRedirect = () => {
      const hash = window.location.hash
      const url = window.location.href
      
      console.log('RedirectHandler - Full URL:', url)
      console.log('RedirectHandler - Hash:', hash)
      console.log('RedirectHandler - Pathname:', window.location.pathname)
      
      // Check if this is a password reset link
      if (hash && hash.includes('type=recovery')) {
        console.log('Detected password reset link, redirecting to /reset-password')
        // Redirect to reset password page while preserving the hash
        setLocation('/reset-password')
        return
      } else if (hash && hash.includes('access_token=')) {
        console.log('Detected access token in hash, checking for other auth flows')
        // Could be other auth flows like email confirmation
        if (hash.includes('type=signup')) {
          console.log('Detected signup confirmation, redirecting to /confirm')
          setLocation('/confirm')
          return
        }
      }
      
      // If authenticated and no special hash, go to home
      if (isAuthenticated && !isLoading) {
        console.log('User is authenticated, redirecting to home')
        setLocation('/home')
      }
    }

    // Run immediately
    handleRedirect()

    // Also listen for hash changes
    const handleHashChange = () => {
      console.log('Hash changed:', window.location.hash)
      handleRedirect()
    }

    window.addEventListener('hashchange', handleHashChange)
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [setLocation, isAuthenticated, isLoading])

  // If we have a hash with auth tokens, show loading
  if (window.location.hash && window.location.hash.includes('access_token=')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">リダイレクト中...</p>
        </div>
      </div>
    )
  }

  // If not authenticated and no special hash, show login
  if (!isAuthenticated && !isLoading) {
    return <Login />
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">読み込み中...</p>
      </div>
    </div>
  )
}