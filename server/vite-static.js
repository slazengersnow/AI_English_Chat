"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
// CommonJS互換の __dirname を process.cwd() で代替
var __dirname = process.cwd();
// このファイルは CommonJS構成でもビルド可能です
console.log("dirname:", path_1.default.join(__dirname, "client/dist"));
