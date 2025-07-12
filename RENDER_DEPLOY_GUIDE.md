# Render デプロイガイド

## 1. 前提条件

- GitHubアカウント
- Renderアカウント
- 必要なAPI キー（Anthropic、Supabase、Stripe）

## 2. リポジトリ準備

### GitHub リポジトリの作成
```bash
# リポジトリを初期化
git init
git add .
git commit -m "Initial commit"

# GitHubにpush
git remote add origin https://github.com/your-username/ai-english-chat.git
git branch -M main
git push -u origin main
```

## 3. Renderでのデプロイ設定

### 3.1 PostgreSQL データベース作成

1. Render Dashboard → 「New」→「PostgreSQL」
2. 設定：
   - **Name**: `ai-english-chat-db`
   - **Database**: `ai_english_chat`
   - **User**: `admin`
   - **Plan**: `Starter` (無料)
   - **Region**: `Oregon (US West)`

### 3.2 Webサービス作成

1. Render Dashboard → 「New」→「Web Service」
2. GitHubリポジトリを選択
3. 設定：
   - **Name**: `ai-english-chat`
   - **Environment**: `Node`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### 3.3 環境変数設定

Advanced → Add Environment Variable で以下を設定：

```
NODE_ENV=production
DATABASE_URL=[PostgreSQL Connection String]
ANTHROPIC_API_KEY=[Your Anthropic API Key]
VITE_SUPABASE_URL=[Your Supabase URL]
VITE_SUPABASE_ANON_KEY=[Your Supabase Anon Key]
STRIPE_SECRET_KEY=[Your Stripe Secret Key]
STRIPE_WEBHOOK_SECRET=[Your Stripe Webhook Secret]
```

### 3.4 自動デプロイ設定

1. Settings → Build & Deploy
2. 「Auto-Deploy」を有効化
3. 「Deploy Hook」を作成してWebhook URLを取得

## 4. GitHub Actions設定

### 4.1 Secrets設定

GitHub リポジトリの Settings → Secrets and variables → Actions で以下を設定：

```
RENDER_API_KEY=[Your Render API Key]
RENDER_SERVICE_ID=[Your Render Service ID]
```

### 4.2 API キー取得

1. Render Dashboard → Account Settings → API Keys
2. 新しいAPI キーを作成
3. Service IDはサービスのURLから取得（例：`srv-xxxxx`）

## 5. データベース初期化

### 5.1 初回マイグレーション

デプロイ後、手動でマイグレーションを実行：

```bash
# Render Shell で実行
npm run db:push
```

### 5.2 管理者アカウント作成

```sql
-- PostgreSQL コンソールで実行
INSERT INTO user_subscriptions (
  user_id, 
  subscription_type, 
  subscription_status, 
  is_admin, 
  created_at, 
  updated_at
) VALUES (
  'slazengersnow1@gmail.com',
  'premium',
  'active',
  true,
  NOW(),
  NOW()
);
```

## 6. 動作確認

### 6.1 ヘルスチェック

```bash
curl https://your-app.onrender.com/health
```

### 6.2 主要機能テスト

1. ユーザー認証（サインアップ・ログイン）
2. 問題生成とAI添削
3. 進捗保存
4. 決済フロー（テストモード）

## 7. 本番運用設定

### 7.1 カスタムドメイン設定

1. Render Dashboard → サービス → Settings
2. Custom Domains で独自ドメインを設定
3. DNS設定でCNAMEレコードを追加

### 7.2 SSL証明書

Renderが自動でLet's Encryptを設定

### 7.3 モニタリング

1. Render Dashboard → Metrics で監視
2. ログ監視：Logs タブで確認
3. アラート設定：Notification Settings

## 8. トラブルシューティング

### 8.1 ビルドエラー

```bash
# デプロイログを確認
# よくある問題：
# - 環境変数の設定不備
# - 依存関係の問題
# - TypeScript エラー
```

### 8.2 データベース接続エラー

```bash
# DATABASE_URL の確認
# Postgres データベースの起動状態確認
```

### 8.3 API エラー

```bash
# API キーの確認
# CORS 設定確認
# ログでエラー詳細確認
```

## 9. 継続的デプロイ

### 9.1 開発フロー

1. Replit で開発
2. GitHub に push
3. 自動デプロイ実行
4. 動作確認

### 9.2 ロールバック

```bash
# 前のデプロイに戻す
# Render Dashboard → Deploys → Previous Deploy → Redeploy
```

## 10. スケーリング

### 10.1 プランアップグレード

- Starter → Standard → Professional
- CPU、メモリ、ストレージの増強

### 10.2 負荷分散

- 複数インスタンス実行
- CDN設定
- キャッシュ最適化