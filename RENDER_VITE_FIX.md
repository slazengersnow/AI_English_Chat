# Render Vite Not Found エラー修正

## 問題
Renderで `vite: not found` エラーが発生している。

## 原因
- viteはdependenciesに存在するが、PATHの問題で見つからない
- npm runを使わずに直接viteを実行しようとしている

## 修正内容

### 1. npxを使用した確実な実行
```bash
# 修正前
vite build

# 修正後
npx vite build
```

### 2. render.yamlの修正
```yaml
buildCommand: npm ci && npx vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

### 3. build.shの修正
```bash
#!/bin/bash
set -e

echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the application using npx for guaranteed vite access
echo "Building application..."
npx vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"
```

### 4. 検証
- viteが正しくnode_modules/.bin/viteに存在することを確認
- npx viteコマンドが正常に動作することを確認
- package-lock.jsonが最新であることを確認

## GitHub Push 後の確認事項

1. Renderでのビルドログを確認
2. viteバージョンが正しく表示されるか確認
3. フロントエンドビルドが正常に完了するか確認
4. サーバーサイドビルドが正常に完了するか確認

## 追加の安全策

### package.jsonでのnpx使用
```json
{
  "scripts": {
    "build": "npx vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
  }
}
```

### 環境変数での確認
```bash
# Renderで以下を確認
which vite
npx vite --version
```

この修正により、RenderでのViteビルドエラーが解決されるはずです。