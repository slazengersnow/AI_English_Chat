"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const chat_1 = __importDefault(require("./chat"));
const stripe_webhook_1 = __importDefault(require("./stripe-webhook"));
const user_1 = __importDefault(require("./user"));
async function registerRoutes(app) {
    app.use("/api/chat", chat_1.default);
    app.use("/api/webhook", stripe_webhook_1.default);
    app.use("/api/user", user_1.default);
}
