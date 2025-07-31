import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function forceEmailSend() {
  console.log('=== 強制メール送信とアカウント状態確認 ===')
  
  const email = 'slazengersnow@gmail.com'
  
  try {
    // 1. 現在のユーザー状態を確認
    console.log('1. ユーザー状態確認中...')
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.log('ユーザー一覧取得エラー:', listError.message)
    } else {
      const targetUser = users.find(u => u.email === email)
      if (targetUser) {
        console.log('現在のユーザー状態:', {
          id: targetUser.id,
          email: targetUser.email,
          confirmed: !!targetUser.email_confirmed_at,
          created: targetUser.created_at,
          last_sign_in: targetUser.last_sign_in_at
        })
      } else {
        console.log('ユーザーが見つかりません')
      }
    }
    
    // 2. 複数の方法で確認メール送信
    const methods = [
      {
        name: '基本確認メール再送信',
        action: () => supabase.auth.resend({
          type: 'signup',
          email: email
        })
      },
      {
        name: 'リダイレクトURL付き確認メール',
        action: () => supabase.auth.resend({
          type: 'signup',
          email: email,
          options: {
            emailRedirectTo: 'https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/auth-callback'
          }
        })
      },
      {
        name: '新規サインアップ試行',
        action: () => supabase.auth.signUp({
          email: email,
          password: 's05936623',
          options: {
            emailRedirectTo: 'https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/auth-callback',
            data: {
              role: 'admin',
              is_admin: true
            }
          }
        })
      }
    ]
    
    for (const method of methods) {
      console.log(`\n2. ${method.name}を実行中...`)
      try {
        const { data, error } = await method.action()
        console.log('結果:', {
          success: !error,
          error: error?.message,
          data: data ? Object.keys(data) : null
        })
        
        // 少し待機
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (err) {
        console.log('エラー:', err.message)
      }
    }
    
    // 3. 代替手段：他のメールアドレスでテスト
    console.log('\n3. 代替メールアドレステスト...')
    const testEmail = 'test.alternate@gmail.com'
    const { data: testData, error: testError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test123456',
      options: {
        emailRedirectTo: 'https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/auth-callback'
      }
    })
    
    console.log('代替テスト結果:', {
      success: !testError,
      error: testError?.message,
      user_created: !!testData?.user
    })
    
    console.log('\n=== 推奨事項 ===')
    console.log('1. Gmail の検索で "from:noreply" を確認')
    console.log('2. 全フォルダを検索: "supabase" または "confirm"')
    console.log('3. Gmailの設定→フィルタとブロック中のアドレス確認')
    console.log('4. 別のメールアドレス（Yahoo、Outlook等）での試行')
    console.log('5. デモモードでの即座利用継続')
    
  } catch (error) {
    console.error('強制送信エラー:', error)
  }
}

console.log('強制メール送信を開始します...')
forceEmailSend()