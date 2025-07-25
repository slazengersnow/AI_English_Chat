export async function registerRoutes(app) {
    app.get("/api", (req, res) => {
        res.send("Hello from server!");
    });
    // 必要であれば他のルートをここに追加
}
