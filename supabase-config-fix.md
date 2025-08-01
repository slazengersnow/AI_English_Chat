# Supabaseパスワードリセット問題の解決方法

## 問題の原因
Supabase設定で指定されているドメインと実際のReplitドメインが一致していません。

**現在のSupabase設定（間違い）:**
- Site URL: `https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app`
- Redirect URLs: `https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app/reset-password`

**正しいReplitドメイン:**
- `https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev`

## 解決手順

### 1. Supabase Authentication設定の修正

Supabaseダッシュボードにアクセス:
1. プロジェクト: `xcjplyhqxgrbdhixmzse`
2. Authentication → URL Configuration

**Site URL を変更:**
```
https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev
```

**Redirect URLs を変更:**
```
https://xcjplyhqxgrbdhixmzse.supabase.co/auth/v1/callback
https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/auth/callback
https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/reset-password
```

### 2. パスワードリセットページの実装確認

プロジェクトに `/reset-password` ルートが存在するか確認してください。
存在しない場合は、実装が必要です。

### 3. 確認方法

設定変更後：
1. 新しくパスワードリセットを実行
2. メール内のリンクが正しいドメインを指しているか確認
3. リンククリック後、Not Foundエラーが解決されているか確認

## 追加の注意事項

- `.replit.app` と `.replit.dev` は異なるドメインです
- ReplitのPreview環境と外部アクセス環境でドメインが変わる場合があります
- 設定変更後は5-10分待ってからテストしてください

## 緊急時の代替方法

パスワードリセットが機能しない場合：
1. `/replit-auth-fix` ページで「管理者直接ログイン」を使用
2. または `/emergency-login` で認証バイパス

## Google OAuth設定も同時に修正推奨

Google Cloud Consoleでも同様にドメイン設定を更新することをお勧めします。