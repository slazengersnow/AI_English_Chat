import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { registerRoutes } from "./routes/index.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
// Health check route for Fly.io
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});
async function start() {
    await registerRoutes(app); // ルーティング登録
    const port = Number(process.env.PORT) || 8080;
    app.listen(port, "0.0.0.0", () => {
        console.log(`Server running on http://0.0.0.0:${port}`);
    });
}
start();
