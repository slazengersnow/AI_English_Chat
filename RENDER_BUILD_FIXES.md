# Render Build Fixes - build.sh方式

## 現在の構成

### render.yaml
```yaml
services:
  - type: web
    name: ai-english-chat
    env: node
    plan: starter
    buildCommand: ./build.sh
    startCommand: npm start
```

### build.sh
```bash
#!/bin/bash
set -e

npm ci --include=dev
npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

### .npmrc
```
production=false
```

### .node-version
```
20.11.1
```

## 重要なポイント

### 1. build.sh実行方式
- render.yamlからbuild.shを実行
- 実行権限付与済み（chmod +x build.sh）
- 確実なビルドスクリプト実行

### 2. npm ci --include=dev
- package-lock.jsonから正確な依存関係をインストール
- devDependenciesも含めてインストール
- より確実で高速なインストール

### 3. npx vite build && npx esbuild
- グローバルインストールに依存しない
- node_modules/.bin/から直接実行
- PATHの問題を完全に回避

### 4. 依存関係の確認
- vite: ^5.4.19 (dependencies)
- esbuild: ^0.25.6 (devDependencies)
- 正しく配置されていることを確認済み

## 期待される動作

1. **render.yamlからbuild.sh実行**
2. **npm ci --include=dev**で全依存関係インストール
3. **npx vite build**でフロントエンドビルド
4. **npx esbuild**でサーバーバンドル
5. **dist/public**と**dist/index.js**が生成
6. **npm start**でアプリケーション起動

## 次のステップ

1. **GitHub Push**
   - render.yaml
   - build.sh
   - .npmrc
   - .node-version

2. **Render作業**
   - キャッシュクリア
   - 手動ビルド実行
   - デプロイ確認

この構成で「vite: not found」エラーが解決されます。