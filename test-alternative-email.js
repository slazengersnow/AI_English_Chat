import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testAlternativeEmails() {
  console.log('=== 代替メールアドレステスト ===')
  
  // テスト用メールアドレス（異なるプロバイダー）
  const testEmails = [
    'test.user@gmail.com',
    'admin.test@yahoo.com', 
    'demo.account@outlook.com'
  ]
  
  for (const email of testEmails) {
    console.log(`\n--- ${email} テスト ---`)
    
    try {
      // 新規サインアップでメール送信
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'test123456',
        options: {
          data: {
            role: 'user',
            test_account: true
          }
        }
      })
      
      console.log('サインアップ結果:', {
        success: !error,
        error: error?.message,
        user_created: !!data?.user,
        email_sent: !error || error.message.includes('already registered')
      })
      
      if (data?.user) {
        console.log('ユーザー情報:', {
          id: data.user.id,
          email: data.user.email,
          confirmed: !!data.user.email_confirmed_at
        })
      }
      
      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (err) {
      console.log('エラー:', err.message)
    }
  }
  
  console.log('\n=== slazengersnow@gmail.com 最終確認 ===')
  
  // メインアカウントの最終確認メール送信
  try {
    const finalResults = await Promise.all([
      supabase.auth.resend({
        type: 'signup',
        email: 'slazengersnow@gmail.com'
      }),
      supabase.auth.resetPasswordForEmail('slazengersnow@gmail.com')
    ])
    
    console.log('確認メール再送信:', !finalResults[0].error ? 'Success' : finalResults[0].error.message)
    console.log('パスワードリセット:', !finalResults[1].error ? 'Success' : finalResults[1].error.message)
    
  } catch (err) {
    console.log('最終送信エラー:', err.message)
  }
  
  console.log('\n=== 推奨事項 ===')
  console.log('1. Gmail の全フォルダを検索: "from:noreply@mail.app.supabase.io"')
  console.log('2. メールクライアントの受信設定確認')
  console.log('3. Supabase プロジェクトのSMTP設定確認')
  console.log('4. デモモードでのアプリ体験を推奨')
}

console.log('代替メールアドレスでのテストを開始します...')
testAlternativeEmails()