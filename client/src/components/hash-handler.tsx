import { useEffect } from 'react'
import { useLocation } from 'wouter'

export function HashHandler() {
  const [, setLocation] = useLocation()

  useEffect(() => {
    // Check immediately when component mounts
    const checkHash = () => {
      const hash = window.location.hash
      const url = window.location.href
      const pathname = window.location.pathname
      
      console.log('HashHandler - Full URL:', url)
      console.log('HashHandler - Hash:', hash)
      console.log('HashHandler - Pathname:', pathname)
      
      if (!hash) {
        console.log('HashHandler - No hash found')
        return
      }

      // Parse hash parameters
      const params = new URLSearchParams(hash.substring(1)) // Remove # prefix
      const type = params.get('type')
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      
      console.log('HashHandler - Parsed params:', {
        type,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      })

      if (type === 'recovery' && accessToken) {
        console.log('HashHandler - Detected password recovery, redirecting to reset-password')
        // Store the hash for the reset-password page to use
        sessionStorage.setItem('supabase_recovery_hash', hash)
        // Clear the hash from URL to prevent loops
        window.history.replaceState({}, '', pathname)
        // Redirect to reset-password page
        setLocation('/reset-password')
      } else if (type === 'signup' && accessToken) {
        console.log('HashHandler - Detected signup confirmation, redirecting to confirm')
        sessionStorage.setItem('supabase_signup_hash', hash)
        window.history.replaceState({}, '', pathname)
        setLocation('/confirm')
      } else if (accessToken) {
        console.log('HashHandler - Detected access token but unknown type:', type)
      }
    }

    // Run immediately
    checkHash()

    // Also listen for hash changes
    const handleHashChange = () => {
      console.log('HashHandler - Hash changed:', window.location.hash)
      checkHash()
    }

    window.addEventListener('hashchange', handleHashChange)
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [setLocation])

  return null
}