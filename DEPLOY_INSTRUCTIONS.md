# Render Deploy Instructions

## 完了した修正内容

### 1. 依存関係の修正
- **vite**: devDependencies → dependencies に移動
- **esbuild**: devDependencies → dependencies に移動
- これにより、Renderビルド環境での"vite: not found"エラーを解決

### 2. Renderデプロイ用ファイル
- **render.yaml**: サービス定義とビルド設定
- **buildCommand**: npm install && npm run build
- **startCommand**: npm start

### 3. 現在のpackage.jsonの状態
```json
{
  "dependencies": {
    "vite": "^6.3.5",
    "esbuild": "^0.25.6",
    ...
  },
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

## GitHubプッシュ手順

1. **コミット対象ファイル**:
   - render.yaml
   - package.json (vite/esbuildがdependenciesに移動)
   - package-lock.json (更新済み)

2. **GitHub Actionsによる自動デプロイ**:
   - mainブランチへのpush時に自動実行
   - Renderサービスが自動的にビルド・デプロイを開始

3. **環境変数設定** (Render側で必要):
   - DATABASE_URL (PostgreSQL接続文字列)
   - ANTHROPIC_API_KEY (Claude APIキー)
   - STRIPE_SECRET_KEY (Stripe秘密キー)
   - STRIPE_WEBHOOK_SECRET (Stripe Webhook)
   - VITE_SUPABASE_URL (Supabase URL)
   - VITE_SUPABASE_ANON_KEY (Supabase匿名キー)

## 期待される結果

1. **ビルド成功**: viteとesbuildがdependenciesにあるため、"not found"エラーなし
2. **デプロイ成功**: render.yamlの設定に従って自動デプロイ
3. **アプリケーション起動**: PORT環境変数を使用して本番環境で起動

## 次の作業
GitHubにプッシュ後、Renderダッシュボードでデプロイ状況を確認してください。