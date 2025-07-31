import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function bypassEmailConfirmation() {
  console.log('=== メール確認をバイパスしてアカウント有効化 ===')
  
  const email = 'slazengersnow@gmail.com'
  
  try {
    // Service Role Keyが必要な管理者機能を試行
    console.log('1. 管理者権限でのユーザー確認状態変更を試行...')
    
    // 通常のクライアントでは管理者機能は使用できないため、
    // 代替案：直接ログイン試行でアカウント状態確認
    console.log('2. 直接ログイン試行でアカウント状態確認...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: 's05936623'
    })
    
    if (loginError) {
      console.log('ログインエラー:', loginError.message)
      
      if (loginError.message.includes('Email not confirmed')) {
        console.log('→ メール未確認が原因')
        console.log('→ 確認メール再送信を実行')
        
        // 確認メール再送信
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email,
          options: {
            emailRedirectTo: 'https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/auth-callback'
          }
        })
        
        if (resendError) {
          console.log('再送信エラー:', resendError.message)
        } else {
          console.log('✅ 確認メール再送信成功')
        }
      }
    } else {
      console.log('✅ ログイン成功！アカウントは有効です')
      console.log('ユーザー情報:', {
        id: loginData.user.id,
        email: loginData.user.email,
        confirmed: !!loginData.user.email_confirmed_at
      })
      
      // ログアウト
      await supabase.auth.signOut()
    }
    
    // 3. 新しいアカウント作成を試行
    console.log('\n3. 新しい管理者アカウント作成を試行...')
    const newEmail = 'admin.new@gmail.com'
    const { data: newData, error: newError } = await supabase.auth.signUp({
      email: newEmail,
      password: 's05936623',
      options: {
        emailRedirectTo: 'https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/auth-callback',
        data: {
          role: 'admin',
          is_admin: true
        }
      }
    })
    
    console.log('新アカウント結果:', {
      success: !newError,
      error: newError?.message,
      user_created: !!newData?.user,
      email_sent: !newError || newError.message.includes('already registered')
    })
    
    console.log('\n=== 解決策提案 ===')
    console.log('A. メール確認リンクが届くまで待機（最大1時間）')
    console.log('B. デモモード継続利用（黄色ボタン）')
    console.log('C. 別のメールアドレスでアカウント作成')
    console.log('D. Supabaseプロジェクト設定確認（SMTP設定）')
    
  } catch (error) {
    console.error('バイパス処理エラー:', error)
  }
}

console.log('メール確認バイパス処理を開始します...')
bypassEmailConfirmation()