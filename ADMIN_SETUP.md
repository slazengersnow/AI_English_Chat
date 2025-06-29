# 管理者アカウント設定手順

## 1. Supabaseでの手動管理者アカウント作成

### 手順:
1. Supabaseプロジェクトダッシュボードにアクセス
2. Authentication > Users へ移動
3. "Add user" ボタンをクリック
4. 以下の情報を入力:
   - **Email**: slazengersnow@gmail.com
   - **Password**: s25124535
   - **Auto Confirm User**: Yes（チェックを入れる）
5. ユーザー作成後、作成されたユーザーをクリックして編集
6. "Raw User Meta Data" セクションに以下のJSONを追加:
```json
{
  "role": "admin",
  "is_admin": true
}
```

## 2. アプリケーションでの管理者権限確認

### 管理者判定ロジック:
- アプリケーションは `user.email === 'slazengersnow@gmail.com'` で管理者を判定
- マイページで管理者アイコン（盾マーク）が表示される
- 管理者専用機能にアクセス可能

### 管理者機能:
- /admin ページへのアクセス
- ユーザー管理機能
- システム統計の確認

## 3. Google OAuth設定（オプション）

Supabaseプロジェクト設定で以下を有効化:
1. Authentication > Providers
2. Google プロバイダーを有効化
3. Client ID と Client Secret を設定
4. Redirect URL: `https://ai-english-chat.com/auth/callback`

## 4. メール認証テンプレート設定

Supabaseでメール認証テンプレートを日本語に変更:
1. Authentication > Templates
2. "Confirm signup" テンプレートを編集
3. 件名: "ご登録ありがとうございます｜AI英作文チャット"
4. 本文に提供された日本語テンプレートを使用

## 5. 確認事項

- [ ] 管理者アカウント作成完了
- [ ] ログイン・ログアウト機能動作確認
- [ ] メール認証フロー確認
- [ ] Google OAuth設定（必要に応じて）
- [ ] 管理者権限確認