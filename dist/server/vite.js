import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { nanoid } from "nanoid";
// ✅ プロジェクトルート（__dirname の代わり）
const projectRoot = process.cwd();
export async function setupVite(app, server) {
    const vite = await createViteServer({
        server: { middlewareMode: true }, // ✅ 推奨される指定方法
        appType: "custom",
        root: path.resolve(projectRoot, "client"),
    });
    // ✅ ViteのmiddlewareをExpressに統合
    app.use(vite.middlewares);
    // ✅ 全リクエストを index.html にフォールバック
    app.use("*", async (req, res, next) => {
        try {
            const url = req.originalUrl;
            const templatePath = path.resolve(projectRoot, "client/index.html");
            let template = await fs.promises.readFile(templatePath, "utf-8");
            // ✅ キャッシュ防止のために `main.tsx` にクエリを付与
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
