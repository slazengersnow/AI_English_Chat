import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { registerRoutes } from "./routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

async function start() {
  await registerRoutes(app); // 修正された関数を呼び出す

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start();
