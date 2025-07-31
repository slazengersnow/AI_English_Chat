import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

async function analyzeApiKeyIssue() {
  console.log('=== API Key問題の詳細分析 ===')
  
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  
  console.log('環境変数チェック:')
  console.log('- VITE_SUPABASE_URL:', url ? 'あり' : 'なし')
  console.log('- VITE_SUPABASE_ANON_KEY:', key ? `あり (長さ: ${key.length})` : 'なし')
  console.log('- URL値:', url)
  console.log('- キー先頭:', key ? key.substring(0, 50) + '...' : 'なし')
  
  if (!url || !key) {
    console.log('❌ 環境変数が設定されていません')
    return
  }
  
  try {
    // Supabaseクライアント作成テスト
    console.log('\nSupabaseクライアント作成テスト...')
    const supabase = createClient(url, key)
    console.log('✅ クライアント作成成功')
    
    // 簡単なAPI呼び出しテスト
    console.log('\n基本API呼び出しテスト...')
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('❌ API呼び出しエラー:', error.message)
      console.log('エラー詳細:', error)
      
      if (error.message.includes('Invalid API key')) {
        console.log('\n🔍 Invalid API Key 詳細分析:')
        console.log('- API キーフォーマット確認必要')
        console.log('- Supabaseプロジェクト設定確認必要')
        console.log('- 新しいAPI キー生成が必要な可能性')
      }
    } else {
      console.log('✅ API呼び出し成功')
      console.log('セッション状態:', data.session ? 'あり' : 'なし')
    }
    
    // 直接ログインテスト
    console.log('\n管理者アカウント直接ログインテスト...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin.new@gmail.com',
      password: 's05936623'
    })
    
    if (loginError) {
      console.log('❌ ログインエラー:', loginError.message)
      console.log('エラーコード:', loginError.status)
    } else {
      console.log('✅ ログイン成功')
      await supabase.auth.signOut()
    }
    
  } catch (error) {
    console.log('❌ 予期しないエラー:', error.message)
  }
  
  console.log('\n=== 解決策 ===')
  console.log('1. 環境変数の再設定')
  console.log('2. Supabaseプロジェクトの確認')
  console.log('3. 新しいAPI キーの生成')
  console.log('4. デモモードでの回避')
}

analyzeApiKeyIssue()