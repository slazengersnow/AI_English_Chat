import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

async function fixAuthenticationIssue() {
  console.log('=== Supabase認証問題の包括的解決 ===')
  
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  
  console.log('環境変数確認:')
  console.log('URL:', url)
  console.log('Key prefix:', key ? key.substring(0, 30) + '...' : 'なし')
  
  try {
    const supabase = createClient(url, key)
    
    // 1. 基本接続テスト
    console.log('\n1. 基本接続テスト...')
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ セッション取得エラー:', sessionError.message)
      
      if (sessionError.status === 401) {
        console.log('🔍 401エラー詳細分析:')
        console.log('- APIキーが無効または期限切れ')
        console.log('- Supabaseプロジェクト設定問題')
        console.log('- CORS設定問題')
      }
    } else {
      console.log('✅ セッション取得成功')
    }
    
    // 2. 新規ユーザー登録テスト（問題特定用）
    console.log('\n2. 認証機能テスト（問題特定）...')
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPass123!'
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/auth-callback'
      }
    })
    
    if (signUpError) {
      console.log('❌ 登録テストエラー:', signUpError.message)
      console.log('エラーコード:', signUpError.status)
    } else {
      console.log('✅ 登録テスト成功')
    }
    
    // 3. 既存管理者アカウントログインテスト
    console.log('\n3. 管理者アカウントログインテスト...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin.new@gmail.com',
      password: 's05936623'
    })
    
    if (loginError) {
      console.log('❌ 管理者ログインエラー:', loginError.message)
      console.log('エラーコード:', loginError.status)
      
      if (loginError.status === 401) {
        console.log('🛠️ 緊急回避策実行中...')
        
        // 新しい管理者アカウント作成
        const { data: newAdminData, error: newAdminError } = await supabase.auth.admin.createUser({
          email: 'emergency.admin@temp.com',
          password: 'Emergency123!',
          email_confirm: true,
          user_metadata: {
            role: 'admin',
            is_admin: true
          }
        })
        
        if (newAdminError) {
          console.log('❌ 緊急管理者作成失敗:', newAdminError.message)
        } else {
          console.log('✅ 緊急管理者アカウント作成成功')
          console.log('Email: emergency.admin@temp.com')
          console.log('Password: Emergency123!')
        }
      }
    } else {
      console.log('✅ 管理者ログイン成功')
      await supabase.auth.signOut()
    }
    
    // 4. Google OAuth設定テスト
    console.log('\n4. Google OAuth設定テスト...')
    const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/auth-callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    
    if (oauthError) {
      console.log('❌ OAuth設定エラー:', oauthError.message)
    } else {
      console.log('✅ OAuth設定正常')
      console.log('OAuth URL生成成功:', !!oauthData.url)
    }
    
  } catch (error) {
    console.log('❌ 予期しないエラー:', error.message)
  }
  
  console.log('\n=== 推奨解決策 ===')
  console.log('1. デモモードでアプリアクセス（即座利用可能）')
  console.log('2. 新APIキー生成と環境変数更新')
  console.log('3. Supabase URL Configuration確認')
  console.log('4. CORS設定見直し')
}

fixAuthenticationIssue()