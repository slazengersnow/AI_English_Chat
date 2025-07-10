import { useEffect, useState } from 'react'
import { supabase } from '@shared/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugAuth() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  
  useEffect(() => {
    const getCurrentUrl = () => {
      const currentUrl = window.location.origin
      const replitUrl = `https://${import.meta.env.VITE_REPL_ID || 'ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d'}.replit.app`
      
      setDebugInfo({
        currentUrl,
        replitUrl,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        redirectUrl: `${currentUrl}/auth/callback`,
        replitRedirectUrl: `${replitUrl}/auth/callback`,
      })
    }
    
    getCurrentUrl()
  }, [])
  
  const testGoogleAuth = async () => {
    try {
      console.log('Testing Google OAuth with debug info:', debugInfo)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: debugInfo.replitRedirectUrl,
        },
      })
      
      console.log('OAuth test result:', { data, error })
    } catch (error) {
      console.error('OAuth test error:', error)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>認証デバッグ情報</CardTitle>
          <CardDescription>Google OAuth認証のデバッグ情報</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">現在のURL:</h3>
              <p className="text-sm text-gray-600">{debugInfo.currentUrl}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Replit URL:</h3>
              <p className="text-sm text-gray-600">{debugInfo.replitUrl}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Supabase URL:</h3>
              <p className="text-sm text-gray-600">{debugInfo.supabaseUrl}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Supabase Key:</h3>
              <p className="text-sm text-gray-600">{debugInfo.hasSupabaseKey ? '設定済み' : '未設定'}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">リダイレクトURL:</h3>
              <p className="text-sm text-gray-600">{debugInfo.redirectUrl}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">ReplitリダイレクトURL:</h3>
              <p className="text-sm text-gray-600">{debugInfo.replitRedirectUrl}</p>
            </div>
            
            <div className="pt-4">
              <Button onClick={testGoogleAuth} className="w-full">
                Google認証テスト
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Supabaseで設定すべき項目：</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Site URL: {debugInfo.replitUrl}</li>
                <li>Redirect URLs: {debugInfo.replitRedirectUrl}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}