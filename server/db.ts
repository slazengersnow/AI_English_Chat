import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";

// WebSocket setup for better performance in production
if (typeof WebSocket !== 'undefined') {
  neonConfig.webSocketConstructor = WebSocket;
} else {
  // Fallback for environments without WebSocket
  try {
    const ws = require('ws');
    neonConfig.webSocketConstructor = ws;
  } catch (e) {
    console.warn("WebSocket setup failed, using HTTP fallback:", e.message);
  }
}

// Use DATABASE_URL for now since SUPABASE_DATABASE_URL appears to be a JWT token
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("Using database URL:", databaseUrl.substring(0, 20) + "...");

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });