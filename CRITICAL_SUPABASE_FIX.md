# 🚨 CRITICAL: Supabase Signup Disabled Issue

## 根本問題の確認
Direct API test results: **422 "signup_disabled"**
これは **Supabase インスタンスレベルで signup が無効** になっていることを意味します。

## 必須修正手順

### 1. Supabase ダッシュボードで即座に修正
**https://supabase.com/dashboard/project/xcjplyhqxgrbdhixmzse**

#### Authentication → Providers → Email
- ✅ **Allow new users to sign up**: **ON** に変更
- ✅ **Confirm email**: **OFF** に変更（SMTP未設定のため）

### 2. 実装完了済み
- ✅ 新しいSupabaseクライアント（環境変数適切注入）
- ✅ 詳細ログ出力システム
- ✅ 完全な再ビルド完了
- ✅ 簡易signup画面作成（/signup-simple）

### 3. テスト手順
1. **Supabase設定変更後**
2. **公開URL** `https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/signup-simple` を開く
3. **ブラウザコンソール確認**: `[Supabase] init` ログ表示確認
4. **slazengersnow@gmail.com** で新規登録実行

### 4. 期待される動作
Supabase設定修正後:
- Direct API test: **200/201** レスポンス
- Frontend signup: **[signup] response** ログにuser情報表示
- 即座にセッション作成され `/` にリダイレクト

## 現在の状況
- **実装**: ✅ 完了 
- **ビルド**: ✅ 完了
- **Supabase設定**: ❌ **要修正**（dashboard でsignup enable必要）

**Supabase dashboard設定変更が完了すれば、認証は正常動作します。**