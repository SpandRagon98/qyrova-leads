import { accessIdentity, requireDatabase } from "../_shared/database.js";
import { json, jsonError, readJson } from "../_shared/http.js";

export async function onRequestGet({ request, env }) {
  const identity = accessIdentity(request, env);
  if (!identity) {
    return jsonError(401, "Cloud sync requires Cloudflare Access authentication.");
  }
  try {
    const db = requireDatabase(env);
    const row = await db
      .prepare(
        "SELECT workspace_data, updated_at FROM workspace_snapshots WHERE user_id = ?1",
      )
      .bind(identity.id)
      .first();
    return json({
      identity,
      data: row?.workspace_data ? JSON.parse(row.workspace_data) : null,
      updatedAt: row?.updated_at || null,
    });
  } catch (error) {
    return jsonError(503, error.message);
  }
}

export async function onRequestPut({ request, env }) {
  const identity = accessIdentity(request, env);
  if (!identity) {
    return jsonError(401, "Cloud sync requires Cloudflare Access authentication.");
  }
  try {
    const db = requireDatabase(env);
    const body = await readJson(request);
    const data = body.data;
    if (
      !data ||
      !Array.isArray(data.leads) ||
      !Array.isArray(data.templates) ||
      !Array.isArray(data.campaigns)
    ) {
      return jsonError(400, "Invalid Qyrova workspace payload.");
    }
    const serialized = JSON.stringify(data);
    const updatedAt = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO workspace_snapshots (user_id, workspace_data, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(user_id) DO UPDATE SET
           workspace_data = excluded.workspace_data,
           updated_at = excluded.updated_at`,
      )
      .bind(identity.id, serialized, updatedAt)
      .run();
    return json({ saved: true, updatedAt });
  } catch (error) {
    const status = error instanceof SyntaxError ? 400 : 503;
    return jsonError(status, error.message);
  }
}

