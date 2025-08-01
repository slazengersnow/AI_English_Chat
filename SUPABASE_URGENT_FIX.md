# 🚨 Supabaseパスワードリセット緊急修正手順

## 現在の状況
- パスワードリセットメールは届いている ✅
- リンクをクリックすると「Not Found」エラー ❌
- 原因：ドメイン設定の不一致

## 🔧 即座に修正すべき設定

### 1. Supabase Authentication URL設定
**現在（間違い）:**
```
Site URL: https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app
```

**正しい設定に変更:**
```
Site URL: https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev
```

### 2. Redirect URLs修正
**追加すべきURL:**
```
https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/reset-password
https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/auth/callback
```

## 📋 具体的な作業手順

### Step 1: Supabaseダッシュボードにアクセス
1. https://supabase.com/dashboard にログイン
2. プロジェクト「xcjplyhqxgrbdhixmzse」を選択
3. 左メニュー「Authentication」をクリック

### Step 2: URL Configuration修正
1. 「Settings」タブを選択
2. 「URL Configuration」セクションを開く
3. **Site URL**を変更:
   ```
   https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev
   ```
4. **Redirect URLs**に追加:
   ```
   https://xcjplyhqxgrbdhixmzse.supabase.co/auth/v1/callback
   https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/auth/callback
   https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/reset-password
   ```

### Step 3: 設定保存
1. 「Save」ボタンをクリック
2. 設定が反映されるまで2-3分待機

### Step 4: 確認テスト
1. 新しくパスワードリセットを実行
2. メール内のリンクが新しいドメインを指しているか確認
3. リンククリック後、正常に`/reset-password`ページが開くか確認

## ⚡ 緊急の場合の代替ログイン方法

設定修正を待てない場合：
1. `https://yourproject.replit.dev/replit-auth-fix` にアクセス
2. 「管理者直接ログイン」を使用:
   - Email: `admin.new@gmail.com`
   - Password: `s05936623`

## 🔍 問題の根本原因

Replitでは以下のような複数のドメインが存在します：
- **Preview URL**: `ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app`
- **Development URL**: `ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev`

現在のSupabase設定は古いPreview URLを使用しているため、実際のDevelopment URLからのリクエストが「Not Found」となっています。

## ✅ 修正後の確認事項

1. パスワードリセットリンクが正しいドメインを指している
2. `/reset-password` ページが正常に開く
3. パスワード変更フォームが表示される
4. 新しいパスワードで正常にログインできる

この修正により、Google OAuthとパスワードリセット両方の問題が解決されるはずです。