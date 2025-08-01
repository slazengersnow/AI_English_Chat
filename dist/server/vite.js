import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { nanoid } from "nanoid";
// __dirname の代わりに process.cwd() を使用
const projectRoot = process.cwd();
export async function setupVite(app, server) {
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "custom",
        root: path.resolve(projectRoot, "client"), // 明示的にViteのルートを指定
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
        try {
            const url = req.originalUrl;
            const templatePath = path.resolve(projectRoot, "client/index.html");
            let template = await fs.promises.readFile(templatePath, "utf-8");
            template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
            const html = await vite.transformIndexHtml(url, template);
            res.status(200).set({ "Content-Type": "text/html" }).end(html);
        }
        catch (e) {
            vite.ssrFixStacktrace(e);
            next(e);
        }
    });
}
