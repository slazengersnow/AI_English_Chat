# Render ビルド修正対応

## 修正内容

### 1. ビルド依存関係の移動
以下のパッケージをdevDependenciesからdependenciesに移動しました：

- `vite`: フロントエンドビルドツール
- `@vitejs/plugin-react`: Reactプラグイン
- `esbuild`: サーバーサイドビルドツール
- `typescript`: TypeScriptコンパイラ
- `tailwindcss`: CSSフレームワーク
- `autoprefixer`: CSS後処理ツール
- `postcss`: CSS処理ツール

### 2. package.json 構成確認
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

### 3. render.yaml 最適化
```yaml
services:
  - type: web
    name: ai-english-chat
    env: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm start
```

### 4. ビルドプロセス
1. `npm ci` - 依存関係インストール
2. `vite build` - フロントエンドビルド (client/dist/)
3. `esbuild` - サーバーサイドビルド (dist/index.js)
4. `npm start` - 本番サーバー起動

### 5. 必要な環境変数
```
NODE_ENV=production
DATABASE_URL=[PostgreSQL URL]
ANTHROPIC_API_KEY=[Anthropic API Key]
VITE_SUPABASE_URL=[Supabase URL]
VITE_SUPABASE_ANON_KEY=[Supabase Anon Key]
STRIPE_SECRET_KEY=[Stripe Secret Key]
STRIPE_WEBHOOK_SECRET=[Stripe Webhook Secret]
```

### 6. トラブルシューティング

#### ビルドエラー対処
```bash
# ローカルでビルドテスト
npm run build

# 依存関係確認
npm ls vite
npm ls esbuild
npm ls typescript
```

#### 本番環境での動作確認
```bash
# ヘルスチェック
curl https://your-app.onrender.com/health

# ログ確認
# Render Dashboard → Logs
```

## GitHub への Push 手順

```bash
# 変更をコミット
git add .
git commit -m "Fix Render build dependencies and scripts"

# GitHubにpush
git push origin main
```

## Render デプロイ手順

1. GitHub リポジトリを更新
2. Render Dashboard で自動デプロイ開始
3. ビルドログを確認
4. 環境変数が正しく設定されているか確認
5. デプロイ完了後、アプリケーションの動作確認

## 確認事項

- ✅ vite が dependencies に移動済み
- ✅ build スクリプトが正しく設定済み
- ✅ esbuild でサーバーサイドビルド設定済み
- ✅ NODE_ENV=production で本番モード動作
- ✅ ヘルスチェックエンドポイント追加済み
- ✅ ポート設定 (process.env.PORT) 対応済み

これで Render でのビルドとデプロイが正常に動作するはずです。