// Supabaseでユーザーメール確認を手動で処理するスクリプト
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xcjplyhqxgrbdhixmzse.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function confirmEmailDirectly() {
  console.log('メール確認の代替手段を試行中...')
  
  try {
    // 直接ログインを試行
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'slazengersnow@gmail.com',
      password: 's05936623',
    })

    if (error) {
      console.log('ログインエラー:', error.message)
      
      // メール再送信を試行
      console.log('確認メール再送信を試行中...')
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: 'slazengersnow@gmail.com'
      })
      
      if (resendError) {
        console.log('再送信エラー:', resendError.message)
      } else {
        console.log('📧 確認メールを再送信しました')
      }
      
      return false
    }

    console.log('✅ ログイン成功:', {
      user: data.user?.email,
      confirmed: data.user?.email_confirmed_at ? 'Yes' : 'No'
    })
    
    return true
  } catch (error) {
    console.error('予期しないエラー:', error)
    return false
  }
}

async function testAuthentication() {
  console.log('=== Supabase認証テスト開始 ===')
  
  const success = await confirmEmailDirectly()
  
  if (!success) {
    console.log('\n⚠️  認証に失敗しました')
    console.log('次の選択肢があります：')
    console.log('1. メール確認リンクをクリック（推奨）')
    console.log('2. デモモードを使用（認証バイパス）')
  }
  
  console.log('=== テスト完了 ===')
}

testAuthentication()