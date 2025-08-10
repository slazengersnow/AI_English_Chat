"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/routes/user.ts
var express_1 = require("express");
var router = (0, express_1.Router)();
router.get("/", function (req, res) {
    res.send("This is the user route");
});
exports.default = router;
