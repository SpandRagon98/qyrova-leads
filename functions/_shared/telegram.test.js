import { describe, expect, it } from "vitest";
import {
  createTelegramLead,
  mergeTelegramLead,
  parseTelegramContact,
  secretsMatch,
  telegramCommand,
} from "./telegram";

describe("Telegram integration", () => {
  it("validates webhook secrets without accepting partial values", () => {
    expect(secretsMatch("correct-secret", "correct-secret")).toBe(true);
    expect(secretsMatch("correct", "correct-secret")).toBe(false);
    expect(secretsMatch("", "")).toBe(false);
  });

  it("normalizes bot commands and contact details", () => {
    expect(telegramCommand("/lead@QyrovaBot now")).toBe("/lead");
    expect(parseTelegramContact({ text: "me@example.com" })).toEqual({
      email: "me@example.com",
      phone: "",
    });
    expect(
      parseTelegramContact({ contact: { phone_number: "+91 98765 43210" } }),
    ).toEqual({ email: "", phone: "+91 98765 43210" });
  });

  it("creates one lead per Telegram chat and updates repeat enquiries", () => {
    const now = "2026-09-21T10:00:00.000Z";
    const first = createTelegramLead({
      chatId: 42,
      user: { first_name: "Asha", last_name: "Rao", username: "asha" },
      draft: {
        fullName: "Asha Rao",
        businessName: "Asha Studio",
        email: "asha@example.com",
        requirement: "Needs a proposal workflow",
      },
      now,
    });
    const created = mergeTelegramLead({ leads: [] }, first, now);
    expect(created.created).toBe(true);
    expect(created.lead).toMatchObject({
      fullName: "Asha Rao",
      leadSource: "Telegram",
      sourceId: "telegram:42",
    });

    const repeat = { ...first, painPoint: "Needs invoicing too", notes: "" };
    const updated = mergeTelegramLead(
      created.workspace,
      repeat,
      "2026-09-22T10:00:00.000Z",
    );
    expect(updated.created).toBe(false);
    expect(updated.workspace.leads).toHaveLength(1);
    expect(updated.lead.notes).toContain("Needs invoicing too");
  });
});
