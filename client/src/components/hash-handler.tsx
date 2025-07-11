import { useEffect } from 'react'
import { useLocation } from 'wouter'

export function HashHandler() {
  const [, setLocation] = useLocation()

  useEffect(() => {
    // Check immediately when component mounts
    const checkHash = () => {
      const hash = window.location.hash
      console.log('HashHandler - Checking hash:', hash)
      console.log('HashHandler - Full URL:', window.location.href)
      console.log('HashHandler - Pathname:', window.location.pathname)
      
      if (hash && hash.includes('type=recovery')) {
        console.log('HashHandler - Detected recovery type, redirecting to reset-password')
        // Clear the hash and redirect
        window.history.replaceState({}, '', window.location.pathname)
        setLocation('/reset-password')
      } else if (hash && hash.includes('access_token=')) {
        console.log('HashHandler - Detected access token in hash')
        if (hash.includes('type=signup')) {
          console.log('HashHandler - Detected signup confirmation')
          setLocation('/confirm')
        }
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