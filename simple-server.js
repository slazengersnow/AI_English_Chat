"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Minimal Express server for testing API endpoints
var express_1 = require("express");
var cors_1 = require("cors");
var app = (0, express_1.default)();
var PORT = 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Test endpoint
app.get("/", function (req, res) {
    res.send("Express Server Running!");
});
// API endpoints
app.post("/api/problem", function (req, res) {
    console.log("🔥 Problem endpoint hit:", req.body);
    res.json({
        japaneseSentence: "チームメンバーと連携を取ってください。",
        hints: ["問題1"],
        dailyLimitReached: false,
        currentCount: 1,
        dailyLimit: 100
    });
});
app.post("/api/evaluate", function (req, res) {
    console.log("🔥 Evaluate endpoint hit:", req.body);
    res.json({
        rating: 4,
        modelAnswer: "Please coordinate with your team members.",
        feedback: "良い回答です。文法的に正確で、意味も適切に伝わります。",
        similarPhrases: [
            "Please work closely with your team members.",
            "Please collaborate with your teammates.",
            "Please cooperate with your team."
        ]
    });
});
app.listen(PORT, "0.0.0.0", function () {
    console.log("\uD83D\uDE80 Server running on http://0.0.0.0:".concat(PORT));
});
