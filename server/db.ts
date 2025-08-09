import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../shared/schema.js";

// 💡 WebSocket setup for Neon
function setupWebSocket() {
  if (typeof WebSocket !== "undefined") {
    neonConfig.webSocketConstructor = WebSocket;
  } else {
    // 関数の中で async 処理
    (async () => {
      try {
        const { WebSocket: WSWebSocket } = await import("ws");
        neonConfig.webSocketConstructor = WSWebSocket;
      } catch (e: unknown) {
        const err = e as Error;
        console.warn(
          "WebSocket setup failed, using HTTP fallback:",
          err.message,
        );
      }
    })();
  }
}

setupWebSocket();

// 💡 NODE_ENV に応じて接続URLを切り替え
const databaseUrl =
  process.env.NODE_ENV === "production"
    ? process.env.DATABASE_URL
    : process.env.DATABASE_URL || process.env.DEV_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "データベース接続URLが見つかりません。環境変数 DATABASE_URL または DEV_DATABASE_URL を設定してください。",
  );
}

console.log("Using database URL:", databaseUrl?.substring(0, 20) + "...");

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
