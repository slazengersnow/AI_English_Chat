# Replit ポート設定の解説

## 現在の設定 (.replit)
```toml
[[ports]]
localPort = 5000
externalPort = 80
```

これにより：
- 内部: localhost:5000
- 外部: https://your-repl-name.replit.dev/ (ポート番号なし)

## ポート5000での直接アクセスを有効にするには

```toml
[[ports]]
localPort = 5000
externalPort = 5000
```

これにより：
- 内部: localhost:5000  
- 外部: https://your-repl-name.replit.dev:5000/

## テスト結果
✅ 現在のサーバー: https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/
✅ API動作: /api/problem, /api/evaluate
✅ フロントエンド: React + Vite 正常配信