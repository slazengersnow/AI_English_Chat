import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { registerRoutes } from "./routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check route for Fly.io
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

async function start() {
  await registerRoutes(app);

  const port = process.env.PORT || 8080; // Fly.io expects 8080
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start();
