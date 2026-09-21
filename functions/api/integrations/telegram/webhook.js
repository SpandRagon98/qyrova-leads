import { ensureDatabase } from "../../../_shared/database.js";
import { cleanText, json, jsonError, readJson } from "../../../_shared/http.js";
import {
  callTelegram,
  createTelegramLead,
  mergeTelegramLead,
  parseTelegramContact,
  secretsMatch,
  telegramCommand,
  telegramConfiguration,
  telegramDisplayName,
  telegramReply,
} from "../../../_shared/telegram.js";

const SKIP_VALUES = new Set(["skip", "none", "n/a", "na", "-", "छोड़ें"]);

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function saveSession(db, chatId, workspaceId, step, draft) {
  await db
    .prepare(
      `INSERT INTO telegram_sessions (chat_id, workspace_id, step, draft_data, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(chat_id) DO UPDATE SET
         workspace_id = excluded.workspace_id,
         step = excluded.step,
         draft_data = excluded.draft_data,
         updated_at = excluded.updated_at`,
    )
    .bind(
      String(chatId),
      workspaceId,
      step,
      JSON.stringify(draft),
      new Date().toISOString(),
    )
    .run();
}

async function beginEnquiry(db, chatId, workspaceId) {
  await saveSession(db, chatId, workspaceId, "name", {});
  return telegramReply(
    chatId,
    "👋 <b>Welcome to Qyrova.</b>\n\nI’ll collect four short details and send your enquiry directly to our CRM.\n\nWhat is your full name?",
    { reply_markup: { remove_keyboard: true } },
  );
}

async function processMessage(db, config, message) {
  const chatId = String(message.chat.id);
  const text = cleanText(message.text, 2_000);
  const command = telegramCommand(text);

  if (command === "/start" || command === "/lead") {
    return beginEnquiry(db, chatId, config.workspaceId);
  }
  if (command === "/cancel") {
    await db
      .prepare("DELETE FROM telegram_sessions WHERE chat_id = ?1")
      .bind(chatId)
      .run();
    return telegramReply(
      chatId,
      "The enquiry was cancelled. Send /lead whenever you want to begin again.",
      { reply_markup: { remove_keyboard: true } },
    );
  }
  if (command === "/help") {
    return telegramReply(
      chatId,
      "Use /lead to send a new enquiry to Qyrova or /cancel to stop the current enquiry.",
    );
  }

  const row = await db
    .prepare(
      "SELECT step, draft_data FROM telegram_sessions WHERE chat_id = ?1 AND workspace_id = ?2",
    )
    .bind(chatId, config.workspaceId)
    .first();
  if (!row) {
    return telegramReply(
      chatId,
      "Send /lead to share an enquiry with the Qyrova sales team.",
    );
  }

  let draft;
  try {
    draft = JSON.parse(row.draft_data || "{}");
  } catch {
    draft = {};
  }

  if (row.step === "name") {
    const fullName = cleanText(text || telegramDisplayName(message.from), 160);
    if (!fullName) return telegramReply(chatId, "Please enter your full name.");
    draft.fullName = fullName;
    await saveSession(db, chatId, config.workspaceId, "business", draft);
    return telegramReply(
      chatId,
      `Thanks, <b>${escapeHtml(fullName)}</b>. What is your company or business name?`,
      {
        reply_markup: {
          keyboard: [["Skip"]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      },
    );
  }

  if (row.step === "business") {
    draft.businessName = SKIP_VALUES.has(text.toLowerCase()) ? "" : text;
    await saveSession(db, chatId, config.workspaceId, "contact", draft);
    return telegramReply(
      chatId,
      "What is the best email address or phone number for a follow-up? You can also share your Telegram phone number or choose Skip.",
      {
        reply_markup: {
          keyboard: [
            [{ text: "Share phone number", request_contact: true }],
            ["Skip"],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      },
    );
  }

  if (row.step === "contact") {
    const contact = parseTelegramContact(message);
    const skipped = SKIP_VALUES.has(text.toLowerCase());
    if (!contact.email && !contact.phone && !skipped) {
      return telegramReply(
        chatId,
        "Please enter a valid email or phone number, share your Telegram phone number, or choose Skip.",
      );
    }
    draft.email = contact.email;
    draft.phone = contact.phone;
    await saveSession(db, chatId, config.workspaceId, "requirement", draft);
    return telegramReply(
      chatId,
      "Finally, briefly describe what you need help with.",
      { reply_markup: { remove_keyboard: true } },
    );
  }

  const requirement = cleanText(text, 2_000);
  if (!requirement) {
    return telegramReply(chatId, "Please describe your requirement in a message.");
  }
  draft.requirement = requirement;
  const workspaceRow = await db
    .prepare(
      "SELECT workspace_data FROM workspace_snapshots WHERE user_id = ?1",
    )
    .bind(config.workspaceId)
    .first();
  if (!workspaceRow?.workspace_data) {
    return telegramReply(
      chatId,
      "Qyrova’s workspace is not initialized yet. Please ask the owner to open the CRM once, then send your requirement again.",
    );
  }

  const workspace = JSON.parse(workspaceRow.workspace_data);
  const now = new Date().toISOString();
  const incoming = createTelegramLead({
    chatId,
    user: message.from,
    draft,
    now,
  });
  const merged = mergeTelegramLead(workspace, incoming, now);
  await db.batch([
    db
      .prepare(
        `UPDATE workspace_snapshots
         SET workspace_data = ?1, updated_at = ?2
         WHERE user_id = ?3`,
      )
      .bind(JSON.stringify(merged.workspace), now, config.workspaceId),
    db
      .prepare("DELETE FROM telegram_sessions WHERE chat_id = ?1")
      .bind(chatId),
  ]);
  return telegramReply(
    chatId,
    `${merged.created ? "✅ Your enquiry has been added" : "✅ Your enquiry has been updated"} in Qyrova. Our team can now follow up from the CRM.\n\nSend /lead if you want to submit another enquiry.`,
    { reply_markup: { remove_keyboard: true } },
  );
}

export async function onRequestPost({ request, env }) {
  const config = telegramConfiguration(env);
  if (!config.configured) {
    return jsonError(503, "Telegram integration is not configured.");
  }
  if (
    !secretsMatch(
      request.headers.get("X-Telegram-Bot-Api-Secret-Token"),
      config.webhookSecret,
    )
  ) {
    return jsonError(401, "Invalid Telegram webhook secret.");
  }

  let db;
  let updateId = "";
  try {
    const update = await readJson(request, 256_000);
    updateId = cleanText(update.update_id, 40);
    if (!updateId) return json({ ok: true, ignored: true });
    db = await ensureDatabase(env);
    await db
      .prepare("DELETE FROM telegram_updates WHERE processed_at < ?1")
      .bind(new Date(Date.now() - 7 * 86_400_000).toISOString())
      .run();
    const inserted = await db
      .prepare(
        `INSERT INTO telegram_updates (update_id, processed_at)
         VALUES (?1, ?2)
         ON CONFLICT(update_id) DO NOTHING`,
      )
      .bind(updateId, new Date().toISOString())
      .run();
    if (!inserted.meta?.changes) return json({ ok: true, duplicate: true });

    const message = update.message;
    if (!message?.chat?.id || message.chat.type !== "private") {
      return json({ ok: true, ignored: true });
    }
    const reply = await processMessage(db, config, message);
    try {
      await callTelegram(env, "sendMessage", reply);
    } catch (error) {
      console.error("Telegram reply failed", error);
    }
    return json({ ok: true });
  } catch (error) {
    if (db && updateId) {
      await db
        .prepare("DELETE FROM telegram_updates WHERE update_id = ?1")
        .bind(updateId)
        .run()
        .catch(() => undefined);
    }
    const status = error instanceof SyntaxError ? 400 : 500;
    return jsonError(status, error.message || "Telegram webhook failed.");
  }
}
