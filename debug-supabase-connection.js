import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('=== Supabase接続診断 ===')
console.log('URL:', supabaseUrl)
console.log('Key length:', supabaseKey?.length)
console.log('Key preview:', supabaseKey?.substring(0, 20) + '...')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が不足しています')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabaseConnection() {
  try {
    console.log('\n=== 基本接続テスト ===')
    
    // 1. Health check
    const healthResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    console.log('Health check status:', healthResponse.status)
    
    // 2. Auth service test
    console.log('\n=== 認証サービステスト ===')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    console.log('Auth service accessible:', !authError)
    if (authError) console.log('Auth error:', authError.message)
    
    // 3. User list (admin function)
    console.log('\n=== ユーザー一覧取得テスト ===')
    try {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
      if (usersError) {
        console.log('Admin access error:', usersError.message)
      } else {
        console.log('Users found:', users?.users?.length || 0)
        users?.users?.forEach(user => {
          console.log(`- ${user.email} (confirmed: ${!!user.email_confirmed_at})`)
        })
      }
    } catch (error) {
      console.log('Admin API not accessible with anon key (expected)')
    }
    
    // 4. メール送信テスト
    console.log('\n=== メール送信機能テスト ===')
    
    // サインアップメール再送信テスト
    const { data: resendData, error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: 'slazengersnow@gmail.com'
    })
    
    console.log('Resend result:', {
      success: !resendError,
      error: resendError?.message,
      data: resendData
    })
    
    // 新規サインアップテスト（既存の場合はエラーになるが、メール送信は試行される）
    console.log('\n=== サインアップメール送信テスト ===')
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'slazengersnow@gmail.com',
      password: 's05936623',
      options: {
        data: { role: 'admin', is_admin: true }
      }
    })
    
    console.log('Signup result:', {
      success: !signupError || signupError.message.includes('already registered'),
      error: signupError?.message,
      userExists: signupError?.message.includes('already registered'),
      data: signupData?.user ? {
        id: signupData.user.id,
        email: signupData.user.email,
        confirmed: !!signupData.user.email_confirmed_at
      } : null
    })
    
    // 5. メール設定確認（可能な範囲で）
    console.log('\n=== Supabaseプロジェクト設定確認 ===')
    console.log('Project URL:', supabaseUrl)
    console.log('Auth URL:', `${supabaseUrl}/auth/v1`)
    
    // Auth settings APIを試行
    try {
      const settingsResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      })
      
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json()
        console.log('Auth settings:', {
          disable_signup: settings.disable_signup,
          email_confirm: settings.email_confirm,
          external_email_enabled: settings.external_email_enabled
        })
      } else {
        console.log('Settings API not accessible:', settingsResponse.status)
      }
    } catch (error) {
      console.log('Settings check failed:', error.message)
    }
    
  } catch (error) {
    console.error('Connection test failed:', error.message)
  }
}

testSupabaseConnection()