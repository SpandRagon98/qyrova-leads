import crypto from "node:crypto";
import { Router } from "express";
import { env, isLinkedInConfigured } from "../config/env.js";
import {
  cleanText,
  fetchJson,
  jsonError,
  parseCookies,
} from "../lib/http.js";
import { TtlStore } from "../services/ttlStore.js";

const router = Router();
const oauthStates = new TtlStore({ maxEntries: 100, ttlMs: 10 * 60_000 });
const tickets = new TtlStore({ maxEntries: 100, ttlMs: 5 * 60_000 });

router.get("/connect", (_req, res) => {
  if (!isLinkedInConfigured()) {
    return jsonError(res, 503, "LinkedIn OpenID Connect is not configured.");
  }
  const state = crypto.randomBytes(24).toString("base64url");
  oauthStates.set(state, true);
  const secure = env.isProduction ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `qyrova_li_state=${encodeURIComponent(state)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600${secure}`,
  );
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.linkedin.clientId,
    redirect_uri: env.linkedin.redirectUri,
    state,
    scope: "openid profile email",
  });
  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});

router.get("/callback", async (req, res) => {
  const state = cleanText(req.query.state, 120);
  const code = cleanText(req.query.code, 2_000);
  const cookieState = parseCookies(req).qyrova_li_state;
  res.clearCookie("qyrova_li_state", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
  });
  if (!code || !state || state !== cookieState || !oauthStates.take(state)) {
    return res.redirect(`${env.appUrl}/?linkedin=error`);
  }
  try {
    const token = await fetchJson(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: env.linkedin.redirectUri,
          client_id: env.linkedin.clientId,
          client_secret: env.linkedin.clientSecret,
        }),
      },
    );
    const profile = await fetchJson("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const ticket = crypto.randomBytes(24).toString("base64url");
    tickets.set(ticket, profile);
    res.redirect(
      `${env.appUrl}/?linkedin=connected&ticket=${encodeURIComponent(ticket)}`,
    );
  } catch {
    res.redirect(`${env.appUrl}/?linkedin=error`);
  }
});

router.get("/session", (req, res) => {
  const profile = tickets.take(cleanText(req.query.ticket, 120));
  if (!profile) return jsonError(res, 404, "LinkedIn session expired.");
  res.json({
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
});

export default router;
