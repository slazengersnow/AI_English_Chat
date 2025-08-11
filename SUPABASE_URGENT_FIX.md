# Supabase 認証修正ガイド

## 緊急修正手順

### 1. Supabase ダッシュボード設定
https://supabase.com/dashboard/project/xcjplyhqxgrbdhixmzse

#### Authentication → URL Configuration
- **Site URL**: `https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev`
- **Additional Redirect URLs**:
  ```
  https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/auth/callback
  https://ai-english-chat.fly.dev/auth/callback
  ```

#### Authentication → Providers → Email
- **Confirm email**: **OFF**（メール認証を無効化）
- **Allow new users to sign up**: **ON**
- **Secure email change**: OFF

### 2. 実装した修正点

#### ✅ 詳細ログ追加
- signup/login時のSupabaseレスポンス詳細ログ
- セッション状態の確認ログ
- エラーメッセージの詳細化

#### ✅ 認証フロー改善
- signup成功時の即座のセッション確認
- メール確認無効時の即ログイン対応
- 認証状態の強化された検証

#### ✅ リダイレクト保護
- 100msの遅延で認証状態変更時のフラッシュ防止
- より安定したルートガード

### 3. デバッグ手順

1. **ブラウザコンソールを開く**
2. **新規登録を実行**
3. **コンソールで以下を確認**:
   - `signup payload`
   - `Supabase signup response`
   - `Session verification`

### 4. 期待される動作

**Email confirmation OFF の場合**:
```
1. signup → 即座にsessionが作成される
2. 「登録・ログイン完了」メッセージ
3. 1.5秒後にメインページへリダイレクト
```

**Email confirmation ON の場合**:
```
1. signup → sessionなし、メール送信
2. 「確認メール送信」メッセージ
3. ログイン画面へリダイレクト
```

### 5. 管理者アカウント確認
- Email: slazengersnow@gmail.com
- ログイン成功時に「管理者」メッセージが表示される
- ホーム画面で管理者ボタンが表示される

### 6. 問題が続く場合の追加手順
1. ブラウザのローカルストレージをクリア
2. Supabase プロジェクトのAuth logsを確認
3. Network tabで /auth/v1/signup のレスポンスを確認