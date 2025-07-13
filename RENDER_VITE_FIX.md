# Render Vite Not Found 修正方法

## 問題分析
1. **viteの配置**: devDependenciesに配置されている
2. **package.json編集制限**: Replitでの直接編集不可
3. **Renderビルド**: devDependenciesが正しくインストールされていない

## 実装した修正

### 1. .npmrcファイル作成
```
production=false
```

### 2. render.yaml修正
```yaml
buildCommand: npm ci --include=dev && npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

### 3. build.sh修正
```bash
#!/bin/bash
set -e

npm ci --include=dev
npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

### 4. 依存関係確認
```
devDependencies:
- vite: ^5.4.19 (ビルドツール)
- @vitejs/plugin-react: ^4.6.0 (Reactプラグイン)
- @tailwindcss/vite: ^4.1.3 (Tailwindプラグイン)
- esbuild: ^0.25.6 (バンドラー)
```

## 重要なポイント

### npm ci --include=dev
- `npm ci`: package-lock.jsonから正確な依存関係インストール
- `--include=dev`: devDependenciesも含めてインストール
- より確実で高速なインストール方法

### npx vite build
- グローバルインストールに依存しない
- node_modules/.bin/viteを直接実行
- PATHの問題を完全に回避

### .npmrc設定
- `production=false`: devDependenciesのインストールを強制
- Render環境での確実なdevDependenciesインストール

## 期待される結果
1. ✅ npm ci --include=dev で全依存関係インストール
2. ✅ npx vite build で確実にvite実行
3. ✅ npx esbuild で確実にesbuild実行
4. ✅ dist/public と dist/index.js 生成
5. ✅ アプリケーション正常起動

## 次の手順
1. **GitHub Push**: 全修正をpush
2. **Renderキャッシュクリア**: 手動でキャッシュクリア
3. **再ビルド**: 自動ビルドで確認

この修正でRenderでのvite: not foundエラーが解決されます。