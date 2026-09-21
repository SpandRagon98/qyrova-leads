import { json } from "../../_shared/http.js";
import { ensureDatabase } from "../../_shared/database.js";
import { telegramConfiguration } from "../../_shared/telegram.js";

export async function onRequestGet({ env }) {
  const telegramConfig = telegramConfiguration(env);
  let telegram = {
    configured: telegramConfig.configured,
    connected: false,
    label: "Telegram Bot",
    botUsername: "",
    botUrl: "",
    lastError: "",
  };
  if (telegramConfig.configured) {
    try {
      const db = await ensureDatabase(env);
      const saved = await db
        .prepare(
          "SELECT bot_username, webhook_url, last_error FROM telegram_integrations WHERE workspace_id = ?1",
        )
        .bind(telegramConfig.workspaceId)
        .first();
      telegram = {
        ...telegram,
        connected: saved?.webhook_url === telegramConfig.webhookUrl,
        botUsername: saved?.bot_username || "",
        botUrl: saved?.bot_username
          ? `https://t.me/${saved.bot_username}`
          : "",
        lastError: saved?.last_error || "",
      };
    } catch (error) {
      telegram = { ...telegram, lastError: error.message };
    }
  }
  return json({
    google: {
      configured: Boolean(env.GOOGLE_PLACES_API_KEY),
      label: "Google Places",
      billingRequired: true,
    },
    openstreetmap: {
      configured: Boolean(env.OSM_CONTACT_EMAIL),
      label: "OpenStreetMap",
      attribution: "© OpenStreetMap contributors",
    },
    yelp: {
      configured: Boolean(env.YELP_API_KEY),
      label: "Yelp",
    },
    directory: {
      configured: Boolean(env.DIRECTORY_API_URL_TEMPLATE),
      label: env.DIRECTORY_NAME || "Public directory",
    },
    linkedin: {
      configured: Boolean(
        env.DB &&
          env.LINKEDIN_CLIENT_ID &&
          env.LINKEDIN_CLIENT_SECRET &&
          env.LINKEDIN_REDIRECT_URI,
      ),
      label: "LinkedIn OpenID Connect",
      leadSearchAvailable: false,
    },
    telegram,
    cloudSync: {
      configured: Boolean(env.DB),
      accessRequired: env.ALLOW_ANONYMOUS_SYNC !== "true",
    },
  });
}
