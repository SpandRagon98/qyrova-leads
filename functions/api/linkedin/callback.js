import { requireDatabase } from "../../_shared/database.js";
import {
  cleanText,
  fetchJson,
  parseCookies,
  requestOrigin,
  secureCookie,
} from "../../_shared/http.js";

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function redirect(request, env, state, ticket = "") {
  const params = new URLSearchParams({ linkedin: state });
  if (ticket) params.set("ticket", ticket);
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${requestOrigin(request, env)}/?${params}`,
      "Set-Cookie": `qyrova_li_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureCookie(
        request,
      )}`,
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const state = cleanText(url.searchParams.get("state"), 120);
  const code = cleanText(url.searchParams.get("code"), 2_000);
  const cookieState = parseCookies(request).qyrova_li_state;
  if (!code || !state || state !== cookieState) {
    return redirect(request, env, "error");
  }
  try {
    const db = requireDatabase(env);
    const storedState = await db
      .prepare(
        "DELETE FROM oauth_states WHERE state = ?1 AND expires_at > ?2 RETURNING state",
      )
      .bind(state, new Date().toISOString())
      .first();
    if (!storedState) return redirect(request, env, "error");

    const token = await fetchJson(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: env.LINKEDIN_REDIRECT_URI,
          client_id: env.LINKEDIN_CLIENT_ID,
          client_secret: env.LINKEDIN_CLIENT_SECRET,
        }),
      },
    );
    const profile = await fetchJson("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const ticket = randomToken();
    await db
      .prepare(
        "INSERT INTO oauth_tickets (ticket, profile_data, expires_at) VALUES (?1, ?2, ?3)",
      )
      .bind(
        ticket,
        JSON.stringify(profile),
        new Date(Date.now() + 300_000).toISOString(),
      )
      .run();
    return redirect(request, env, "connected", ticket);
  } catch {
    return redirect(request, env, "error");
  }
}

