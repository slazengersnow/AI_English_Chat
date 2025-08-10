"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/routes/chat.ts
var express_1 = require("express");
var router = (0, express_1.Router)();
router.get("/", function (req, res) {
    res.send("This is the chat route");
});
exports.default = router;
