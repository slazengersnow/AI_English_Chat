# Render Final Setup - vite: not found 修正

## 完了した修正内容

### 1. render.yamlの修正
```yaml
buildCommand: npm install && npm run build
```

### 2. .node-versionファイル作成
```
20.11.1
```

### 3. package.jsonのbuildスクリプト確認
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
  }
}
```

### 4. vite.config.tsの条件分岐確認
既にREPL_IDによる条件分岐が実装済み：
```typescript
...(process.env.NODE_ENV !== "production" &&
process.env.REPL_ID !== undefined
  ? [
      await import("@replit/vite-plugin-cartographer").then((m) =>
        m.cartographer(),
      ),
    ]
  : []),
```

### 5. 依存関係の確認
- ✅ vite: ^5.4.19 (dependencies)
- ✅ esbuild: ^0.25.6 (devDependencies)
- ✅ @replit/vite-plugin-cartographer: ^0.2.7 (devDependencies)
- ✅ @replit/vite-plugin-runtime-error-modal: ^0.0.3 (devDependencies)

## 重要なポイント

1. **Renderでのビルド**：
   - `npm install` ですべての依存関係をインストール
   - `npm run build` でpackage.jsonのbuildスクリプトを実行
   - viteとesbuildを順次実行

2. **Node.jsバージョン**：
   - .node-versionで20.11.1を指定
   - Renderでの安定したNode.js環境を保証

3. **Replit専用プラグイン**：
   - vite.config.tsでREPL_ID環境変数による条件分岐済み
   - 本番環境では@replitプラグインは読み込まれない

## 次の手順

1. **GitHub Push**: 全修正内容をpushする
2. **Renderキャッシュクリア**: 手動でキャッシュクリア実行
3. **再ビルド**: 自動ビルドが実行される
4. **確認**: `vite: not found`エラーの解決を確認

## 期待される結果

- ✅ npm install が正常実行
- ✅ npm run build が正常実行  
- ✅ vite build が正常実行
- ✅ esbuild が正常実行
- ✅ dist/public と dist/index.js が生成
- ✅ アプリケーションが正常起動

これでRenderでの確実なビルドが実現されます。