// Supabaseでユーザーアカウントを作成するスクリプト
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xcjplyhqxgrbdhixmzse.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key length:', supabaseKey?.length)

if (!supabaseKey) {
  console.error('VITE_SUPABASE_ANON_KEY is missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdminAccount() {
  console.log('管理者アカウントを再作成中...')
  
  try {
    // 既存アカウントの確認メール再送信を試行
    console.log('既存アカウントの確認メール再送信を試行中...')
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: 'slazengersnow@gmail.com'
    })
    
    if (resendError) {
      console.log('再送信エラー:', resendError.message)
      console.log('新規アカウント作成を試行中...')
    } else {
      console.log('✅ 確認メール再送信成功!')
      console.log('📧 slazengersnow@gmail.com にメール確認リンクを送信しました')
      return true
    }

    // 新規アカウント作成
    const { data, error } = await supabase.auth.signUp({
      email: 'slazengersnow@gmail.com',
      password: 's05936623',
      options: {
        data: {
          role: 'admin',
          is_admin: true
        },
        emailRedirectTo: `${process.env.VITE_SUPABASE_URL || 'https://xcjplyhqxgrbdhixmzse.supabase.co'}/auth/v1/verify`
      }
    })

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ アカウントは既に存在します')
        console.log('📧 メール確認リンクが送信されました（確認メールをチェックしてください）')
        return true
      }
      console.error('アカウント作成エラー:', error.message)
      return false
    }

    console.log('✅ アカウント作成成功:', {
      user: data.user?.email,
      id: data.user?.id,
      confirmed: data.user?.email_confirmed_at ? 'Yes' : 'No'
    })

    console.log('📧 メール確認リンクを送信しました')
    console.log('メールボックスをチェックして確認リンクをクリックしてください')

    return true
  } catch (error) {
    console.error('予期しないエラー:', error)
    return false
  }
}

createAdminAccount()