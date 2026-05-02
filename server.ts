import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({
    verify: (req: any, _res, buf) => {
      if (req.originalUrl.startsWith('/api/webhook')) {
        req.rawBody = buf;
      }
    }
  }));

  // API routes
  const { default: checkoutHandler } = await import("./api/checkout.ts");
  const { default: webhookHandler } = await import("./api/webhook.ts");
  const { default: verifyHandler } = await import("./api/verify-session.ts");

  app.post("/api/checkout", checkoutHandler);
  app.post("/api/webhook", webhookHandler);
  app.get("/api/verify-session", verifyHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
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

startServer();
