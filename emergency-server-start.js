// 緊急サーバー起動スクリプト
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'client/dist')));

// すべてのリクエストをindex.htmlにリダイレクト（SPA用）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 緊急サーバーが http://0.0.0.0:${PORT} で起動しました`);
});