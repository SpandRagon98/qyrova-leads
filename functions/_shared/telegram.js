import { cleanText } from "./http.js";

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/;

export function telegramConfiguration(env) {
  const workspaceId = cleanText(env.TELEGRAM_WORKSPACE_ID, 320);
  const webhookSecret = cleanText(env.TELEGRAM_WEBHOOK_SECRET, 256);
  const appUrl = cleanText(env.APP_URL, 500).replace(/\/+$/, "");
  const validWebhookSecret = /^[A-Za-z0-9_-]{24,256}$/.test(webhookSecret);
  return {
    configured: Boolean(
      env.DB &&
        env.TELEGRAM_BOT_TOKEN &&
        workspaceId &&
        validWebhookSecret &&
        appUrl,
    ),
    workspaceId,
    webhookSecret,
    webhookUrl: appUrl
      ? `${appUrl}/api/integrations/telegram/webhook`
      : "",
  };
}

export function secretsMatch(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  if (!a || a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

export function telegramDisplayName(user = {}) {
  return cleanText(
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.username ||
      "Telegram enquiry",
    160,
  );
}

export function parseTelegramContact(message = {}) {
  const text = cleanText(message.text, 320);
  const sharedPhone = cleanText(message.contact?.phone_number, 80);
  return {
    email: cleanText(text.match(EMAIL_PATTERN)?.[0], 320),
    phone: cleanText(sharedPhone || text.match(PHONE_PATTERN)?.[0], 80),
  };
}

export function telegramCommand(text) {
  return cleanText(text, 120).split(/\s+/)[0].split("@")[0].toLowerCase();
}

export function createTelegramLead({ chatId, user, draft, now }) {
  const fullName = cleanText(draft.fullName || telegramDisplayName(user), 160);
  const names = fullName.split(/\s+/).filter(Boolean);
  const username = cleanText(user?.username, 80);
  const requirement = cleanText(draft.requirement, 2_000);
  const sourceProfile = username ? `https://t.me/${username}` : "";
  return {
    id: crypto.randomUUID(),
    firstName: names[0] || fullName,
    lastName: names.slice(1).join(" "),
    fullName,
    businessName: cleanText(draft.businessName, 160),
    role: "",
    industry: "",
    businessType: "",
    country: "",
    state: "",
    city: "",
    linkedinUrl: "",
    websiteUrl: "",
    email: cleanText(draft.email, 320),
    phone: cleanText(draft.phone, 80),
    leadSource: "Telegram",
    sourceId: `telegram:${chatId}`,
    telegramChatId: String(chatId),
    telegramUsername: username,
    telegramProfileUrl: sourceProfile,
    notes: [
      `Telegram enquiry received ${now.slice(0, 10)}.`,
      username ? `Username: @${username}` : "",
      requirement,
    ]
      .filter(Boolean)
      .join("\n"),
    painPoint: requirement,
    status: "New",
    lastContacted: "",
    followUpDate: "",
    createdAt: now,
  };
}

export function mergeTelegramLead(workspace, lead, now) {
  const leads = Array.isArray(workspace.leads) ? workspace.leads : [];
  const index = leads.findIndex((item) => item.sourceId === lead.sourceId);
  if (index === -1) {
    return {
      workspace: { ...workspace, leads: [lead, ...leads] },
      lead,
      created: true,
    };
  }
  const current = leads[index];
  const notes = [
    current.notes,
    `Telegram update received ${now.slice(0, 10)}.`,
    lead.painPoint,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(-4_000);
  const updated = {
    ...current,
    fullName: lead.fullName || current.fullName,
    firstName: lead.firstName || current.firstName,
    lastName: lead.lastName || current.lastName,
    businessName: lead.businessName || current.businessName,
    email: lead.email || current.email,
    phone: lead.phone || current.phone,
    leadSource: "Telegram",
    telegramUsername: lead.telegramUsername || current.telegramUsername,
    telegramProfileUrl: lead.telegramProfileUrl || current.telegramProfileUrl,
    painPoint: lead.painPoint || current.painPoint,
    notes,
    updatedAt: now,
  };
  return {
    workspace: {
      ...workspace,
      leads: leads.map((item, leadIndex) =>
        leadIndex === index ? updated : item,
      ),
    },
    lead: updated,
    created: false,
  };
}

export async function callTelegram(env, method, payload = {}) {
  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(
      cleanText(result.description, 300) ||
        `Telegram ${method} failed (${response.status}).`,
    );
  }
  return result.result;
}

export function telegramReply(chatId, text, options = {}) {
  return {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...options,
  };
}
