import path from "node:path";
import express from "express";
import { env } from "./config/env.js";
import integrationsRouter from "./routes/integrations.js";
import linkedinRouter from "./routes/linkedin.js";

function toOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

export function createApp() {
  const app = express();
  const allowedOrigins = new Set(
    [env.appUrl, ...env.corsOrigins].map(toOrigin).filter(Boolean),
  );
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: "256kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "qyrova-leads" });
  });
  app.use("/api/integrations", integrationsRouter);
  app.use("/api/linkedin", linkedinRouter);
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API route not found." });
  });

  app.use(express.static(env.distDir, { maxAge: env.isProduction ? "1h" : 0 }));
  app.get(/.*/, (_req, res, next) => {
    if (!env.isProduction) return next();
    res.sendFile(path.join(env.distDir, "index.html"));
  });
  app.use((error, _req, res, _next) => {
    void _next;
    console.error(error);
    res.status(500).json({ error: "Unexpected server error." });
  });

  return app;
}
