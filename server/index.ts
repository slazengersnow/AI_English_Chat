import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

// __dirname の代替取得
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ✅ publicディレクトリ（dist/public）を正しく指定
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));

// ✅ すべてのルートに index.html を返す
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[express] serving on port ${PORT}`);
});
