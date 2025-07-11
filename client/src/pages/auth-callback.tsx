import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '@shared/supabase'
import { useToast } from '@/hooks/use-toast'

export default function AuthCallback() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = window.location.hash
      const search = window.location.search
      
      console.log('AuthCallback - Hash:', hash)
      console.log('AuthCallback - Search:', search)
      
      if (hash) {
        // Parse hash parameters
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const expiresAt = params.get('expires_at')
        const tokenType = params.get('token_type')
        const type = params.get('type')
        
        console.log('AuthCallback - Parsed params:', {
          type,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          expiresAt,
          tokenType
        })
        
        if (accessToken && expiresAt) {
          try {
            // Set the session using Supabase
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
              expires_at: parseInt(expiresAt),
              token_type: tokenType || 'bearer',
              user: null
            })
            
            if (error) {
              console.error('Session set error:', error)
              toast({
                title: "認証エラー",
                description: `認証に失敗しました: ${error.message}`,
                variant: "destructive",
              })
              setLocation('/login')
            } else {
              console.log('Session set successfully:', data)
              
              // Clear the hash from URL
              window.history.replaceState({}, '', window.location.pathname)
              
              toast({
                title: "認証成功",
                description: "ログインが完了しました！",
              })
              
              // Redirect to home
              setLocation('/')
            }
          } catch (error) {
            console.error('Auth callback error:', error)
            toast({
              title: "認証エラー",
              description: "認証処理中にエラーが発生しました",
              variant: "destructive",
            })
            setLocation('/login')
          }
        } else {
          console.log('Missing required auth parameters')
          toast({
            title: "認証エラー",
            description: "認証パラメータが不足しています",
            variant: "destructive",
          })
          setLocation('/login')
        }
      } else {
        console.log('No hash found in auth callback')
        setLocation('/login')
      }
    }

    handleAuthCallback()
  }, [setLocation, toast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">認証を処理中...</p>
      </div>
    </div>
  )
}