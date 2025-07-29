"use strict";
// server/vite-static.mts
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// このファイルは .mts としてESMで動作します
console.log("dirname:", __dirname);
