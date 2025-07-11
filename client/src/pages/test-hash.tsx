import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestHash() {
  const [currentHash, setCurrentHash] = useState('')
  const [storedHash, setStoredHash] = useState('')

  useEffect(() => {
    const updateHashInfo = () => {
      setCurrentHash(window.location.hash)
      setStoredHash(sessionStorage.getItem('supabase_recovery_hash') || 'none')
    }

    updateHashInfo()
    window.addEventListener('hashchange', updateHashInfo)
    
    return () => window.removeEventListener('hashchange', updateHashInfo)
  }, [])

  const simulatePasswordReset = () => {
    // Simulate a Supabase password reset hash
    const testHash = '#access_token=test_token_123&type=recovery&refresh_token=test_refresh_123'
    window.location.hash = testHash
    console.log('Simulated password reset hash:', testHash)
  }

  const clearHash = () => {
    window.location.hash = ''
    sessionStorage.removeItem('supabase_recovery_hash')
    setCurrentHash('')
    setStoredHash('none')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Hash Handler Test</CardTitle>
          <CardDescription>
            Test the hash fragment detection functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Current Hash:</p>
            <p className="text-xs text-gray-600 break-all">{currentHash || 'none'}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium">Stored Hash:</p>
            <p className="text-xs text-gray-600 break-all">{storedHash}</p>
          </div>
          
          <div className="space-y-2">
            <Button onClick={simulatePasswordReset} className="w-full">
              Simulate Password Reset Hash
            </Button>
            <Button onClick={clearHash} variant="outline" className="w-full">
              Clear Hash
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            Check the browser console for HashHandler logs
          </div>
        </CardContent>
      </Card>
    </div>
  )
}