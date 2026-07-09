import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from '../server/db.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function startDevelopmentServer() {
    const app = express();
    const port = process.env.PORT || 5000;
    // 1. Fire up and check your local SQLite storage connection
    initializeDatabase();
    // 2. Standard JSON incoming payload middleware parser
    app.use(express.json());
    // [Placeholder for your API Routes - We will plug these in next!]
    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok', engine: 'SQLite + Express Active' });
    });
    // 3. Create Vite server in middleware mode to inject the React frontend
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom',
        root: path.resolve(__dirname, '../client')
    });
    // Use vite's connect instance as a middleware
    app.use(vite.middlewares);
    // 4. Catch-all route to serve the index.html from frontend
    app.use('*', async (req, res, next) => {
        const url = req.originalUrl;
        try {
            // Always read fresh index.html template from your client root folder
            let template = await vite.transformIndexHtml(url, `
        <!DOCTYPE html>
        <html lang="en">
          <head><meta charset="UTF-8" /><title>MimoMagic</title></head>
          <body class="bg-slate-50 text-slate-900"><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
        </html>
      `);
            res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        }
        catch (e) {
            vite.ssrFixStacktrace(e);
            next(e);
        }
    });
    app.listen(port, () => {
        console.log(`🚀 MimoMagic running at http://localhost:${port}`);
    });
}
startDevelopmentServer().catch((err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
});
