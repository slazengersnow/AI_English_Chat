# 🚨 緊急アクセス手順

## Agent-Preview同期問題が発生している可能性があります

### 状況
- サーバー側：正常動作
- ブラウザ側：認証失敗、UI更新されない
- 推定原因：Replit Preview環境の同期問題

### 緊急アクセス方法

#### 方法1: /force-demo ページ
1. ブラウザで以下にアクセス：
   ```
   https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/force-demo
   ```
2. 「強制デモモード開始」ボタンをクリック

#### 方法2: ブラウザコンソール直接実行
1. ブラウザの開発者ツールを開く（F12）
2. Consoleタブを選択
3. 以下のコードを貼り付けて実行：
   ```javascript
   localStorage.setItem('demoMode', 'true');
   localStorage.setItem('emergencyDemo', 'true');
   sessionStorage.setItem('demoActive', 'true');
   window.location.href = '/';
   ```

#### 方法3: ハードリフレッシュ
1. Ctrl + Shift + R (Windows/Linux)
2. Cmd + Shift + R (Mac)

### 開発機再起動実行済み
- Replit仮想Linuxマシンを再起動
- キャッシュクリア処理
- 同期問題の解決を試行

### 確認事項
実際に認証問題が解決されている可能性があります。上記の方法でアクセスしてみてください。