// server/index.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes/index.js"; // ✅ .js拡張子が必要
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../dist/client")));
app.get("/health", (_req, res) => {
    res.status(200).send("OK");
});
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/client/index.html"));
});
async function start() {
    await registerRoutes(app);
    const port = Number(process.env.PORT) || 8080;
    app.listen(port, "0.0.0.0", () => {
        console.log(`Server running on http://0.0.0.0:${port}`);
    });
}
start();
