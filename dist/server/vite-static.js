"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
// CommonJS互換の __dirname を process.cwd() で代替
const __dirname = process.cwd();
// このファイルは CommonJS構成でもビルド可能です
console.log("dirname:", path_1.default.join(__dirname, "client/dist"));
