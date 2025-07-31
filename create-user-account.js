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
  console.log('管理者アカウントを作成中...')
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'slazengersnow@gmail.com',
      password: 's05936623',
      options: {
        data: {
          role: 'admin',
          is_admin: true
        }
      }
    })

    if (error) {
      console.error('アカウント作成エラー:', error.message)
      return false
    }

    console.log('アカウント作成成功:', {
      user: data.user?.email,
      id: data.user?.id,
      confirmed: data.user?.email_confirmed_at ? 'Yes' : 'No'
    })

    // メール確認が必要な場合の対処
    if (!data.user?.email_confirmed_at) {
      console.log('📧 メール確認が必要です。確認後に再度ログインしてください。')
    }

    return true
  } catch (error) {
    console.error('予期しないエラー:', error)
    return false
  }
}

createAdminAccount()