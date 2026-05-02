import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

// API handlers (Import after setup if needed, but top level is fine with tsx)
import checkoutHandler from "./api/checkout.ts";
import webhookHandler from "./api/webhook.ts";
import verifyHandler from "./api/verify-session.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // IMPORTANT: Webhook needs raw body for signature verification
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      if (req.originalUrl && req.originalUrl.startsWith('/api/webhook')) {
        req.rawBody = buf;
      }
    }
  }));

  // API Routes
  app.post("/api/checkout", checkoutHandler);
  app.all("/api/webhook", webhookHandler);
  app.get("/api/verify-session", verifyHandler);
  
  // Health check
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);
    
    // Explicitly handle SPA fallback in dev mode if needed
    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });

  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
