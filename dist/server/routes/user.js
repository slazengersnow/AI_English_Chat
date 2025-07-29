"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/routes/user.ts
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.send("This is the user route");
});
exports.default = router;
