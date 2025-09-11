# 🚀 Replit Workflows設定手順

## 問題解決のための重要な設定

### 現在の問題
- `.replit`の`run = "npm run dev"`で2つのサーバーが起動
- `5001→3001`ポートマッピングで3001ポートがユーザーに公開される

### 解決策：Workflowsでシングルポート実行

#### 1. Workflowsツールアクセス
- Replit workspaceで「Workflows」ツールに移動
- カスタムワークフローを作成

#### 2. 新しいワークフロー設定
```yaml
name: "Single Port Server"
run: "node start-single-port.js"
```

#### 3. 効果
- ✅ 5000ポートのみで動作
- ✅ 3001ポートアクセス完全防止  
- ✅ Viteミドルウェア + HMR正常動作
- ✅ 管理者ダッシュボード正常アクセス

#### 4. 使用方法
- Runボタン横のドロップダウンから「Single Port Server」を選択
- このワークフローをデフォルトに設定することを推奨
- 3001ポート問題が完全解決

#### 5. 警告システム
- レガシー実行（npm run dev）時に警告メッセージが表示
- 3001ポートリンクが表示された場合の対処法を案内

### 技術的詳細
- `start-single-port.js`: シングルポートサーバースクリプト
- `server/vite-fixed.ts`: エイリアス解決修正版Vite設定
- Express + Viteミドルウェア統合で5000ポートのみ使用