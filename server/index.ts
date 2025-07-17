import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ✅ 修正ポイント：public 配信ディレクトリを正確に指定（dist/public）
const publicPath = path.join(__dirname, "public");

app.use(express.static(publicPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[express] serving on port ${PORT}`);
});
