import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function confirmUserEmail() {
  console.log('=== 新管理者アカウントでログインテスト ===')
  
  const email = 'admin.new@gmail.com'
  const password = 's05936623'
  
  try {
    console.log(`${email} でログイン試行中...`)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
    
    if (error) {
      console.error('ログインエラー:', error.message)
      
      if (error.message.includes('Email not confirmed')) {
        console.log('メール確認が必要です。確認メールを再送信します...')
        
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email,
          options: {
            emailRedirectTo: 'https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/auth-callback'
          }
        })
        
        if (resendError) {
          console.error('再送信エラー:', resendError.message)
        } else {
          console.log('✅ 確認メール再送信成功')
          console.log('admin.new@gmail.com のメールボックスを確認してください')
        }
      }
      
      return
    }
    
    console.log('✅ ログイン成功！')
    console.log('ユーザー情報:', {
      id: data.user.id,
      email: data.user.email,
      confirmed: !!data.user.email_confirmed_at,
      created: data.user.created_at,
      metadata: data.user.user_metadata
    })
    
    // セッション情報も確認
    console.log('セッション情報:', {
      access_token: data.session?.access_token ? 'あり' : 'なし',
      refresh_token: data.session?.refresh_token ? 'あり' : 'なし',
      expires_at: data.session?.expires_at
    })
    
    // ログアウト
    await supabase.auth.signOut()
    console.log('ログアウト完了')
    
    console.log('\n=== 使用方法 ===')
    console.log('1. ブラウザでログインページに移動')
    console.log('2. メールアドレス: admin.new@gmail.com')
    console.log('3. パスワード: s05936623')
    console.log('4. ログインボタンをクリック')
    console.log('5. 管理者権限でアプリにアクセス可能')
    
  } catch (error) {
    console.error('予期しないエラー:', error)
  }
}

confirmUserEmail()