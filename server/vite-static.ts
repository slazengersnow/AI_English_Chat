import path from "path";

// CommonJS互換の __dirname を process.cwd() で代替
const __dirname = process.cwd();

// このファイルは CommonJS構成でもビルド可能です
console.log("dirname:", path.join(__dirname, "client/dist"));
