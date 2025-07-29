"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupVite = setupVite;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const vite_1 = require("vite");
const nanoid_1 = require("nanoid");
// __dirname の代わりに process.cwd() を使用
const projectRoot = process.cwd();
async function setupVite(app, server) {
    const vite = await (0, vite_1.createServer)({
        server: { middlewareMode: true },
        appType: "custom",
        root: path_1.default.resolve(projectRoot, "client"), // 明示的にViteのルートを指定
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
        try {
            const url = req.originalUrl;
            const templatePath = path_1.default.resolve(projectRoot, "client/index.html");
            let template = await fs_1.default.promises.readFile(templatePath, "utf-8");
            template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${(0, nanoid_1.nanoid)()}"`);
            const html = await vite.transformIndexHtml(url, template);
            res.status(200).set({ "Content-Type": "text/html" }).end(html);
        }
        catch (e) {
            vite.ssrFixStacktrace(e);
            next(e);
        }
    });
}
