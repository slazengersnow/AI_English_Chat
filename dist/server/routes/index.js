"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
// server/routes/index.ts
const express_1 = require("express");
const chat_1 = __importDefault(require("./chat"));
const user_1 = __importDefault(require("./user"));
// ⚠️ 👇 これは削除（index.tsでは登録しない）
/* import stripeWebhookRoutes from "./stripe-webhook.js"; */
function registerRoutes(app) {
    const router = (0, express_1.Router)();
    router.use("/chat", chat_1.default);
    router.use("/user", user_1.default);
    // router.use("/webhook", stripeWebhookRoutes); // 👈 削除
    app.use("/api", router);
}
