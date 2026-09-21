import { accessIdentity, ensureDatabase } from "../../../_shared/database.js";
import { json, jsonError } from "../../../_shared/http.js";
import {
  callTelegram,
  telegramConfiguration,
} from "../../../_shared/telegram.js";

export async function onRequestPost({ request, env }) {
  const config = telegramConfiguration(env);
  if (!config.configured) {
    return jsonError(
      503,
      "Set TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_WORKSPACE_ID and APP_URL in Cloudflare first.",
    );
  }
  const identity = accessIdentity(request, env);
  if (
    !identity ||
    identity.id.toLowerCase() !== config.workspaceId.toLowerCase()
  ) {
    return jsonError(403, "Only the configured Qyrova workspace owner can connect Telegram.");
  }

  try {
    const db = await ensureDatabase(env);
    const workspace = await db
      .prepare("SELECT user_id FROM workspace_snapshots WHERE user_id = ?1")
      .bind(config.workspaceId)
      .first();
    if (!workspace) {
      return jsonError(
        409,
        "Open Qyrova once and wait for cloud sync before connecting Telegram.",
      );
    }
    const bot = await callTelegram(env, "getMe");
    await callTelegram(env, "setWebhook", {
      url: config.webhookUrl,
      secret_token: config.webhookSecret,
      allowed_updates: ["message"],
      drop_pending_updates: false,
    });
    const webhook = await callTelegram(env, "getWebhookInfo");
    const connected = webhook.url === config.webhookUrl;
    await db
      .prepare(
        `INSERT INTO telegram_integrations
           (workspace_id, bot_username, webhook_url, connected_at, last_error)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(workspace_id) DO UPDATE SET
           bot_username = excluded.bot_username,
           webhook_url = excluded.webhook_url,
           connected_at = excluded.connected_at,
           last_error = excluded.last_error`,
      )
      .bind(
        config.workspaceId,
        bot.username || "",
        connected ? webhook.url : "",
        new Date().toISOString(),
        webhook.last_error_message || "",
      )
      .run();
    return json({
      connected,
      botUsername: bot.username || "",
      botUrl: bot.username ? `https://t.me/${bot.username}` : "",
      webhookUrl: config.webhookUrl,
      pendingUpdates: Number(webhook.pending_update_count || 0),
      lastError: webhook.last_error_message || "",
    });
  } catch (error) {
    return jsonError(502, error.message || "Telegram setup failed.");
  }
}
