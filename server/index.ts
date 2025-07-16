import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// ESM（import構文）で __dirname を使うための定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// dist/public フォルダを静的ファイルとして公開
const publicPath = path.join(__dirname, "..", "dist", "public");
app.use(express.static(publicPath));

// すべてのリクエストに対して index.html を返す（SPA対応）
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
