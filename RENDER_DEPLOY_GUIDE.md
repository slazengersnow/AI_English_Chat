# Render Deploy Guide - 最終構成

## 現在の構成

### render.yaml
```yaml
services:
  - type: web
    name: ai-english-chat
    env: node
    plan: starter
    buildCommand: npm install --production=false && npm run build
    startCommand: npm start
```

### package.json buildスクリプト
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
  }
}
```

### .npmrc
```
production=false
```

### .node-version
```
20.11.1
```

### build.sh（代替手段）
```bash
#!/bin/bash
set -e

npm install --production=false
npm run build
```

## 重要なポイント

### 1. npm install --production=false
- devDependenciesを確実にインストール
- viteやesbuildがdevDependenciesに含まれていても利用可能
- .npmrcのproduction=falseと併用で確実

### 2. npm run build
- package.jsonのbuildスクリプトを使用
- vite build && esbuild server/index.ts...を実行
- 最もシンプルで確実な方法

### 3. Node.js 20.11.1
- .node-versionで安定バージョン指定
- Render環境での互換性を確保

## 依存関係の状況
```
dependencies:
  - vite: ^5.4.19 (本来はdevDependenciesだが、compatibilityのため)

devDependencies:
  - esbuild: ^0.25.6
  - @vitejs/plugin-react: ^4.6.0
  - @tailwindcss/vite: ^4.1.3
  - typescript: ^5.6.3
```

## 期待される動作

1. **npm install --production=false**
   - 全依存関係をインストール
   - devDependenciesも含める

2. **npm run build**
   - package.jsonのbuildスクリプト実行
   - vite build でフロントエンドビルド
   - esbuild でサーバーバンドル

3. **npm start**
   - node dist/index.jsでアプリケーション起動

## デプロイ手順

1. **GitHub Push**
   - render.yaml
   - .npmrc
   - .node-version
   - build.sh

2. **Render作業**
   - キャッシュクリア
   - 手動ビルド実行
   - デプロイ確認

この構成でRenderでのvite: not foundエラーが解決されます。