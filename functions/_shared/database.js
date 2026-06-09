import { cleanText } from "./http.js";

let schemaPromise;

export function requireDatabase(env) {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding DB is not configured.");
  }
  return env.DB;
}

export async function ensureDatabase(env) {
  const db = requireDatabase(env);
  if (!schemaPromise) {
    schemaPromise = db
      .batch([
        db.prepare(
          `CREATE TABLE IF NOT EXISTS workspace_snapshots (
            user_id TEXT PRIMARY KEY,
            workspace_data TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS oauth_states (
            state TEXT PRIMARY KEY,
            expires_at TEXT NOT NULL
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS oauth_tickets (
            ticket TEXT PRIMARY KEY,
            profile_data TEXT NOT NULL,
            expires_at TEXT NOT NULL
          )`,
        ),
        db.prepare(
          `CREATE TABLE IF NOT EXISTS rate_limits (
            rate_key TEXT PRIMARY KEY,
            request_count INTEGER NOT NULL DEFAULT 1,
            expires_at TEXT NOT NULL
          )`,
        ),
        db.prepare(
          "CREATE INDEX IF NOT EXISTS idx_oauth_states_expiry ON oauth_states(expires_at)",
        ),
        db.prepare(
          "CREATE INDEX IF NOT EXISTS idx_oauth_tickets_expiry ON oauth_tickets(expires_at)",
        ),
        db.prepare(
          "CREATE INDEX IF NOT EXISTS idx_rate_limits_expiry ON rate_limits(expires_at)",
        ),
      ])
      .catch((error) => {
        schemaPromise = undefined;
        throw error;
      });
  }
  await schemaPromise;
  return db;
}

export function accessIdentity(request, env) {
  const email = cleanText(
    request.headers.get("CF-Access-Authenticated-User-Email"),
    320,
  ).toLowerCase();
  if (email) return { id: email, email, protectedByAccess: true };

  if (env.ALLOW_ANONYMOUS_SYNC === "true") {
    return {
      id: cleanText(env.ANONYMOUS_WORKSPACE_ID || "default", 120),
      email: "",
      protectedByAccess: false,
    };
  }
  return null;
}

export async function consumeRateLimit(request, env) {
  if (!env.DB) return true;
  const db = await ensureDatabase(env);
  const ip = cleanText(request.headers.get("CF-Connecting-IP") || "local", 64);
  const windowStart = Math.floor(Date.now() / 600_000) * 600_000;
  const key = `${ip}:${windowStart}`;
  await db.prepare("DELETE FROM rate_limits WHERE expires_at <= ?1")
    .bind(new Date().toISOString())
    .run();
  await db.prepare(
    `INSERT INTO rate_limits (rate_key, request_count, expires_at)
     VALUES (?1, 1, ?2)
     ON CONFLICT(rate_key) DO UPDATE SET request_count = request_count + 1`,
  )
    .bind(key, new Date(windowStart + 1_200_000).toISOString())
    .run();
  const row = await db.prepare(
    "SELECT request_count FROM rate_limits WHERE rate_key = ?1",
  )
    .bind(key)
    .first();
  return Number(row?.request_count || 0) <= 30;
}

export async function consumeProviderSlot(provider, env) {
  if (!env.DB || provider !== "openstreetmap") return true;
  const db = await ensureDatabase(env);
  const second = Math.floor(Date.now() / 1_000);
  const key = `provider:openstreetmap:${second}`;
  await db.prepare(
    `INSERT INTO rate_limits (rate_key, request_count, expires_at)
     VALUES (?1, 1, ?2)
     ON CONFLICT(rate_key) DO UPDATE SET request_count = request_count + 1`,
  )
    .bind(key, new Date((second + 2) * 1_000).toISOString())
    .run();
  const row = await db.prepare(
    "SELECT request_count FROM rate_limits WHERE rate_key = ?1",
  )
    .bind(key)
    .first();
  return Number(row?.request_count || 0) === 1;
}
