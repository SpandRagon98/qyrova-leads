import { ensureDatabase } from "../../_shared/database.js";
import { cleanText, json, jsonError } from "../../_shared/http.js";

export async function onRequestGet({ request, env }) {
  const ticket = cleanText(new URL(request.url).searchParams.get("ticket"), 120);
  if (!ticket) return jsonError(400, "LinkedIn session ticket is missing.");
  try {
    const db = await ensureDatabase(env);
    const row = await db
      .prepare(
        "DELETE FROM oauth_tickets WHERE ticket = ?1 AND expires_at > ?2 RETURNING profile_data",
      )
      .bind(ticket, new Date().toISOString())
      .first();
    if (!row) return jsonError(404, "LinkedIn session expired.");
    const profile = JSON.parse(row.profile_data);
    return json({
      profile: {
        id: profile.sub,
        name: profile.name || "",
        firstName: profile.given_name || "",
        lastName: profile.family_name || "",
        email: profile.email || "",
        picture: profile.picture || "",
      },
      limitation:
        "OpenID Connect returns only the signed-in member's own profile. LinkedIn lead search requires separate partner approval.",
    });
  } catch (error) {
    return jsonError(503, error.message);
  }
}
