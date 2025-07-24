"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
const serverless_1 = require("@neondatabase/serverless");
const neon_serverless_1 = require("drizzle-orm/neon-serverless");
const schema = __importStar(require("@shared/schema"));
// WebSocket setup for better performance in production
if (typeof WebSocket !== "undefined") {
    serverless_1.neonConfig.webSocketConstructor = WebSocket;
}
else {
    try {
        const { WebSocket: WSWebSocket } = await Promise.resolve().then(() => __importStar(require('ws')));
        serverless_1.neonConfig.webSocketConstructor = WSWebSocket;
    }
    catch (e) {
        const err = e;
        console.warn("WebSocket setup failed, using HTTP fallback:", err.message);
    }
}
// 💡 NODE_ENV に応じて接続URLを切り替え
const databaseUrl = process.env.NODE_ENV === "production"
    ? process.env.DATABASE_URL
    : process.env.DATABASE_URL || process.env.DEV_DATABASE_URL;
if (!databaseUrl) {
    throw new Error("データベース接続URLが見つかりません。環境変数 DATABASE_URL または DEV_DATABASE_URL を設定してください。");
}
console.log("Using database URL:", databaseUrl?.substring(0, 20) + "...");
exports.pool = new serverless_1.Pool({ connectionString: databaseUrl });
exports.db = (0, neon_serverless_1.drizzle)({ client: exports.pool, schema });
