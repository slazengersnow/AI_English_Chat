import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@shared/schema";

// WebSocket setup for better performance in production
if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
} else {
  try {
    const ws = require("ws");
    neonConfig.webSocketConstructor = ws;
  } catch (e) {
    console.warn("WebSocket setup failed, using HTTP fallback:", e.message);
  }
}

// 💡 NODE_ENV に応じて接続URLを切り替え
const databaseUrl =
  process.env.NODE_ENV === "production"
    ? process.env.DATABASE_URL
    : process.env.DEV_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "データベース接続URLが見つかりません。環境変数 DATABASE_URL または DEV_DATABASE_URL を設定してください。",
  );
}

console.log("使用中のDB URL:", databaseUrl.substring(0, 20) + "...");

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
