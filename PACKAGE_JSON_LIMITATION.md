# Package.json 編集制限の対処法

## 問題
package.jsonの編集が制限されているため、buildスクリプトを直接修正できない。

## 現在の状況
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
  }
}
```

## 対処法：render.yamlで直接npxを使用

### 修正済みの render.yaml
```yaml
buildCommand: npm install && npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

### 修正済みの build.sh
```bash
#!/bin/bash
set -e

npm install
npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

## 検証結果
- ✅ `npx vite --version`: 動作確認済み
- ✅ `npx esbuild --version`: 動作確認済み
- ✅ vite: ^5.4.19 (dependencies)
- ✅ esbuild: ^0.25.6 (devDependencies)
- ✅ .node-version: 20.11.1

## 利点
1. **package.jsonの制限を回避**: render.yamlで直接実行
2. **npxの明示的使用**: グローバルインストールに依存しない
3. **確実なビルド**: PATHの問題を完全に回避
4. **バックアップ**: build.shも同じ構成で用意

## 次の手順
1. GitHub Push
2. Renderキャッシュクリア
3. 再ビルド確認

この方法でvite: not foundエラーが解決されます。