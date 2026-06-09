import { jsonError, requestOrigin, secureCookie } from "../../_shared/http.js";
import { requireDatabase } from "../../_shared/database.js";

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function onRequestGet({ request, env }) {
  if (
    !env.LINKEDIN_CLIENT_ID ||
    !env.LINKEDIN_CLIENT_SECRET ||
    !env.LINKEDIN_REDIRECT_URI
  ) {
    return jsonError(503, "LinkedIn OpenID Connect is not configured.");
  }
  try {
    const db = requireDatabase(env);
    const state = randomToken();
    await db
      .prepare(
        "INSERT INTO oauth_states (state, expires_at) VALUES (?1, ?2)",
      )
      .bind(state, new Date(Date.now() + 600_000).toISOString())
      .run();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: env.LINKEDIN_CLIENT_ID,
      redirect_uri: env.LINKEDIN_REDIRECT_URI,
      state,
      scope: "openid profile email",
    });
    return new Response(null, {
      status: 302,
      headers: {
        Location: `https://www.linkedin.com/oauth/v2/authorization?${params}`,
        "Set-Cookie": `qyrova_li_state=${encodeURIComponent(
          state,
        )}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600${secureCookie(request)}`,
        "Cache-Control": "no-store",
        "X-Qyrova-App-Origin": requestOrigin(request, env),
      },
    });
  } catch (error) {
    return jsonError(503, error.message);
  }
}

