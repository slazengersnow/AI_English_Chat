"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var routes_js_1 = require("./server/routes.js");
var app = (0, express_1.default)();
var PORT = 5001; // Different port to avoid conflict
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Critical debug middleware to track all requests
app.use(function (req, res, next) {
    console.log("\uD83D\uDD0D REQUEST: ".concat(req.method, " ").concat(req.url));
    next();
});
// Simple test routes
app.get("/api/ping", function (req, res) {
    console.log("🔥 PING ENDPOINT HIT!");
    res.json({ message: "pong", timestamp: new Date().toISOString() });
});
app.post("/api/problem", function (req, res) {
    console.log("🔥 PROBLEM ENDPOINT HIT!", req.body);
    res.json({
        message: "Problem endpoint working",
        body: req.body,
        timestamp: new Date().toISOString()
    });
});
// Register main routes
(0, routes_js_1.registerMainRoutes)(app);
app.listen(PORT, "0.0.0.0", function () {
    console.log("\uD83D\uDE80 Test server running on port ".concat(PORT));
});
