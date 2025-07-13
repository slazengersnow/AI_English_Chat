# Railway Deploy Guide

## 完了した修正内容

### 1. 全ビルド依存関係の修正
Railway環境での"Cannot find package"エラーを解決するため、すべてのビルド関連パッケージをdependenciesに移動：

- **vite**: devDependencies → dependencies
- **esbuild**: devDependencies → dependencies  
- **@vitejs/plugin-react**: devDependencies → dependencies
- **@tailwindcss/typography**: devDependencies → dependencies
- **autoprefixer**: devDependencies → dependencies
- **postcss**: devDependencies → dependencies
- **tailwindcss**: devDependencies → dependencies
- **typescript**: devDependencies → dependencies

### 2. Railway設定ファイル
**railway.json**:
```json
{
  "build": {
    "command": "unset REPL_ID && NODE_ENV=production npm install && NODE_ENV=production npm run build"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

### 3. PostCSS設定修正
**postcss.config.js**:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 4. 削除したパッケージ
- @tailwindcss/vite: TailwindCSS 4.0の新しいViteプラグインが互換性問題を起こすため削除
- @tailwindcss/postcss: 標準のtailwindcssプラグインを使用

### 3. package.jsonスクリプト
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

## 期待される動作

1. **ビルドフェーズ**: 
   - npm install (全パッケージインストール)
   - npm run build (Viteビルドとesbuildでサーバーバンドル)

2. **デプロイフェーズ**:
   - npm start (本番環境でアプリケーション起動)

## 必要な環境変数 (Railway側で設定)

- `DATABASE_URL`: PostgreSQL接続文字列
- `ANTHROPIC_API_KEY`: Claude APIキー  
- `STRIPE_SECRET_KEY`: Stripe秘密キー
- `STRIPE_WEBHOOK_SECRET`: Stripe Webhook秘密キー
- `VITE_SUPABASE_URL`: Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Supabase匿名キー
- `PORT`: Railway自動設定（通常3000）

## GitHubプッシュ後の手順

1. GitHubにコードをプッシュ
2. Railway側で自動デプロイが開始
3. ビルドログでエラーがないか確認
4. デプロイ完了後、アプリケーションが正常に起動することを確認

この設定により、Railway環境での"Cannot find package"エラーが解決されます。