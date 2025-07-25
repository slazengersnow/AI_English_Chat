import { Express } from "express";

export async function registerRoutes(app: Express) {
  app.get("/api", (req, res) => {
    res.send("Hello from server!");
  });

  // 必要であれば他のルートをここに追加
}
