"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// Fixed server with proper Claude API integration
var express_1 = require("express");
var cors_1 = require("cors");
var dotenv_1 = require("dotenv");
var vite_1 = require("vite");
var path_1 = require("path");
// Import the working route handlers
var routes_js_1 = require("./server/routes.js");
var admin_routes_js_1 = require("./server/admin-routes.js");
dotenv_1.default.config();
var app = (0, express_1.default)();
var PORT = Number(process.env.PORT) || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
console.log("🔥 Starting fixed server with working Claude API...");
// CRITICAL: API routes BEFORE Vite middleware
app.get("/api/ping", function (req, res) {
    console.log("🔥 Ping endpoint working!");
    res.json({ message: "pong", timestamp: new Date().toISOString() });
});
app.post("/api/problem", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("🔥 Problem endpoint hit:", req.body);
                return [4 /*yield*/, (0, routes_js_1.handleProblemGeneration)(req, res)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
app.post("/api/evaluate-with-claude", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("🔥 Claude evaluation endpoint hit:", req.body);
                return [4 /*yield*/, (0, routes_js_1.handleClaudeEvaluation)(req, res)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
app.get("/api/status", function (req, res) {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        apiKey: !!process.env.ANTHROPIC_API_KEY
    });
});
// Register admin routes
(0, admin_routes_js_1.registerAdminRoutes)(app);
// Vite setup with proper API exclusion
function setupServer() {
    return __awaiter(this, void 0, void 0, function () {
        var vite_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(process.env.NODE_ENV !== "production")) return [3 /*break*/, 2];
                    console.log("🚀 Setting up Vite with API protection...");
                    return [4 /*yield*/, (0, vite_1.createServer)({
                            server: { middlewareMode: true },
                            appType: "custom",
                            root: path_1.default.resolve("client"),
                        })];
                case 1:
                    vite_2 = _a.sent();
                    app.use(vite_2.middlewares);
                    // SPA fallback that properly excludes API routes
                    app.use("*", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                        var url, template, e_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    url = req.originalUrl;
                                    // Skip API routes - let Express handle them first
                                    if (url.startsWith("/api/")) {
                                        console.log("\uD83D\uDEAB API route ".concat(url, " not found"));
                                        return [2 /*return*/, res.status(404).json({ error: "API endpoint not found" })];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, vite_2.transformIndexHtml(url, "\n<!doctype html>\n<html lang=\"ja\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1\" />\n    <title>AI English Chat</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>\n        ")];
                                case 2:
                                    template = _a.sent();
                                    res.status(200).set({ "Content-Type": "text/html" }).end(template);
                                    return [3 /*break*/, 4];
                                case 3:
                                    e_1 = _a.sent();
                                    vite_2.ssrFixStacktrace(e_1);
                                    next(e_1);
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    _a.label = 2;
                case 2:
                    app.listen(PORT, "0.0.0.0", function () {
                        console.log("\uD83D\uDE80 Fixed server running on port ".concat(PORT));
                        console.log("🔥 API endpoints available:");
                        console.log("   GET  /api/ping");
                        console.log("   POST /api/problem");
                        console.log("   POST /api/evaluate-with-claude");
                        console.log("   GET  /api/status");
                    });
                    return [2 /*return*/];
            }
        });
    });
}
setupServer().catch(console.error);
