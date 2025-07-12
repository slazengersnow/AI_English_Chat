# AI瞬間英作文チャット

リアルタイムでAI添削を受けながら英作文練習ができるWebアプリケーションです。

## 機能

- 📝 レベル別英作文練習（TOEIC、中学・高校英語、基本動詞、ビジネスメール）
- 🤖 Anthropic Claude 3 Haikuによる瞬間添削・評価
- 📊 詳細な進捗追跡とレポート
- 🔄 繰り返し練習機能
- 🎯 カスタムシナリオ練習
- 💰 Stripe決済システム（7日間無料トライアル）
- 🔐 Supabase認証システム

## 技術スタック

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Anthropic Claude 3 Haiku API
- **Authentication**: Supabase Auth
- **Payment**: Stripe
- **Deployment**: Render (Production) / Replit (Development)

## 開発環境セットアップ

### 1. 環境変数設定

`.env.example`を`.env`にコピーして必要な値を設定：

```bash
cp .env.example .env
```

### 2. 依存関係インストール

```bash
npm install
```

### 3. データベース設定

```bash
npm run db:push
```

### 4. 開発サーバー起動

```bash
npm run dev
```

## 本番デプロイ（Render）

### 1. GitHub連携

1. このリポジトリをGitHubにpush
2. Renderでサービスを作成
3. GitHubリポジトリを連携

### 2. 環境変数設定

Renderの環境変数に以下を設定：

- `NODE_ENV`: `production`
- `DATABASE_URL`: PostgreSQLデータベースURL
- `ANTHROPIC_API_KEY`: Anthropic APIキー
- `VITE_SUPABASE_URL`: Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Supabase匿名キー
- `STRIPE_SECRET_KEY`: Stripe シークレットキー
- `STRIPE_WEBHOOK_SECRET`: Stripe Webhook シークレット

### 3. Build設定

- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 4. 自動デプロイ

GitHubのmain/masterブランチにpushすると自動でデプロイされます。

## API エンドポイント

### 認証
- `GET /api/user-subscription` - ユーザーサブスクリプション取得

### 練習
- `POST /api/problem` - 問題取得
- `POST /api/translate` - 翻訳評価
- `POST /api/simulation-problem/:scenarioId` - シミュレーション問題取得
- `POST /api/simulation-translate` - シミュレーション翻訳評価

### 進捗
- `GET /api/progress` - 進捗履歴取得
- `GET /api/difficulty-stats` - 難易度別統計
- `GET /api/daily-count` - 日別問題数取得

### 決済
- `POST /api/create-checkout-session` - Stripe決済セッション作成
- `POST /api/stripe-webhook` - Stripe Webhook処理

## ファイル構成

```
├── client/                 # フロントエンド
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   ├── pages/         # ページコンポーネント
│   │   ├── hooks/         # カスタムフック
│   │   └── lib/           # ユーティリティ
├── server/                # バックエンド
│   ├── routes.ts          # API ルート
│   ├── storage.ts         # データベース操作
│   └── index.ts           # サーバー起動
├── shared/                # 共通定義
│   └── schema.ts          # データベーススキーマ
├── render.yaml            # Render設定
├── Dockerfile             # Docker設定
└── .github/workflows/     # GitHub Actions
```

## ライセンス

MIT License