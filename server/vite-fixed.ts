// server/vite-fixed.ts - 修正版Vite設定
import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { nanoid } from "nanoid";

// ✅ プロジェクトルート（__dirname の代わり）
const projectRoot = process.cwd();

export async function setupViteFixed(app: express.Express, server: any) {
  // ✅ Vite設定ファイルを明示的に指定
  const vite = await createViteServer({
    configFile: path.resolve(projectRoot, "vite.config.ts"), // 設定ファイル明示
    server: { middlewareMode: true }, // ✅ 推奨される指定方法
    appType: "custom",
    root: path.resolve(projectRoot, "client"),
  });

  // ✅ ViteのmiddlewareをExpressに統合
  app.use(vite.middlewares);

  // ✅ APIルート以外を index.html にフォールバック
  app.use("*", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const url = req.originalUrl;

      // ✅ APIルートとintrospectは除外
      if (url.startsWith('/api/') || url.startsWith('/__introspect')) {
        return next();
      }

      const templatePath = path.resolve(projectRoot, "client/index.html");
      let template = await fs.promises.readFile(templatePath, "utf-8");

      // ✅ キャッシュ防止のために `main.tsx` にクエリを付与
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      const html = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}