import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function forceEmailSend() {
  console.log('=== 強制メール送信テスト ===')
  
  try {
    // 1. 複数の方法でメール送信を試行
    const methods = [
      {
        name: '確認メール再送信',
        action: () => supabase.auth.resend({
          type: 'signup',
          email: 'slazengersnow@gmail.com'
        })
      },
      {
        name: 'パスワードリセットメール',
        action: () => supabase.auth.resetPasswordForEmail('slazengersnow@gmail.com', {
          redirectTo: 'https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/reset-password'
        })
      },
      {
        name: '新規サインアップ（重複エラーでもメール試行）',
        action: () => supabase.auth.signUp({
          email: 'slazengersnow@gmail.com',
          password: 's05936623',
          options: {
            data: { role: 'admin' },
            emailRedirectTo: 'https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/confirm'
          }
        })
      }
    ]
    
    for (const method of methods) {
      console.log(`\n--- ${method.name} ---`)
      try {
        const { data, error } = await method.action()
        console.log('Success:', !error)
        console.log('Error:', error?.message || 'None')
        console.log('Data:', data ? JSON.stringify(data, null, 2) : 'None')
        
        // 各試行の間に少し待機
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (err) {
        console.log('Exception:', err.message)
      }
    }
    
    // 2. 手動でHTTP APIを直接呼び出し
    console.log('\n=== 直接HTTP API呼び出し ===')
    
    try {
      const directResponse = await fetch(`${supabaseUrl}/auth/v1/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          type: 'signup',
          email: 'slazengersnow@gmail.com'
        })
      })
      
      const directResult = await directResponse.text()
      console.log('Direct API Status:', directResponse.status)
      console.log('Direct API Response:', directResult)
    } catch (err) {
      console.log('Direct API Error:', err.message)
    }
    
    // 3. ユーザー状態確認
    console.log('\n=== ユーザー状態確認 ===')
    try {
      const { data: authUser } = await supabase.auth.getUser()
      console.log('Current user:', authUser?.user?.email || 'None')
      
      // 管理者APIでユーザー詳細取得を試行（失敗予想だが情報収集のため）
      const adminResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      })
      console.log('Admin API access:', adminResponse.status)
    } catch (err) {
      console.log('User check error:', err.message)
    }
    
  } catch (error) {
    console.error('Force email send failed:', error.message)
  }
  
  console.log('\n=== メール確認案内 ===')
  console.log('📧 確認先:')
  console.log('  - 受信トレイ')
  console.log('  - 迷惑メール/スパムフォルダ')
  console.log('  - プロモーション/ソーシャルタブ（Gmail）')
  console.log('  - すべてのメールフォルダ')
  console.log('📧 送信者: noreply@mail.app.supabase.io')
  console.log('📧 件名候補: "Confirm your signup", "Email confirmation", "Welcome"')
}

forceEmailSend()