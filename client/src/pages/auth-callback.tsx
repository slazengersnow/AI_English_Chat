import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '@shared/supabase'
import { useToast } from '@/hooks/use-toast'

export default function AuthCallback() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          toast({
            title: "認証エラー",
            description: "認証処理中にエラーが発生しました",
            variant: "destructive",
          })
          setLocation('/login')
          return
        }

        if (data.session) {
          toast({
            title: "ログイン成功",
            description: "AI瞬間英作文チャットへようこそ！",
          })
          setLocation('/')
        } else {
          setLocation('/login')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        toast({
          title: "エラー",
          description: "認証処理中にエラーが発生しました",
          variant: "destructive",
        })
        setLocation('/login')
      }
    }

    handleAuthCallback()
  }, [setLocation, toast])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )
}