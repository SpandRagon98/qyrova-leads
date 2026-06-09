import { json } from "../_shared/http.js";

export function onRequestGet({ env }) {
  return json({
    status: "ok",
    service: "qyrova-leads",
    runtime: "cloudflare-pages-functions",
    databaseConfigured: Boolean(env.DB),
  });
}

