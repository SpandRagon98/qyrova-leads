import { ensureDatabase } from "../_shared/database.js";
import { json, jsonError } from "../_shared/http.js";

export async function onRequestGet({ env }) {
  try {
    if (env.DB) await ensureDatabase(env);
    return json({
      status: "ok",
      service: "qyrova-leads",
      runtime: "cloudflare-pages-functions",
      databaseConfigured: Boolean(env.DB),
      databaseReady: Boolean(env.DB),
    });
  } catch (error) {
    return jsonError(503, `D1 initialization failed: ${error.message}`);
  }
}
