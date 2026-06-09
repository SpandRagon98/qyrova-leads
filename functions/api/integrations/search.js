import {
  consumeProviderSlot,
  consumeRateLimit,
} from "../../_shared/database.js";
import { cleanText, json, jsonError, readJson } from "../../_shared/http.js";
import { searchProvider } from "../../_shared/providers.js";

export async function onRequestPost({ request, env, waitUntil }) {
  try {
    if (!(await consumeRateLimit(request, env))) {
      return jsonError(429, "Search limit reached. Try again in a few minutes.");
    }
    const body = await readJson(request, 32_000);
    const provider = cleanText(body.provider, 40).toLowerCase();
    const query = cleanText(body.query);
    const location = cleanText(body.location);
    const limit = Math.max(1, Math.min(Number(body.limit) || 10, 20));
    const includeContactDetails = Boolean(body.includeContactDetails);
    if (!query) return jsonError(400, "Enter a business type or search keyword.");
    if (!location) return jsonError(400, "Enter a city, region, or country.");

    const cacheUrl = new URL("/api/cache/provider-search", request.url);
    cacheUrl.search = new URLSearchParams({
      provider,
      query,
      location,
      limit: String(limit),
      contacts: String(includeContactDetails),
    });
    const cacheKey = new Request(cacheUrl, { method: "GET" });
    const cached = await caches.default.match(cacheKey);
    if (cached) {
      const payload = await cached.json();
      return json({ ...payload, cached: true });
    }
    if (!(await consumeProviderSlot(provider, env))) {
      return jsonError(
        429,
        "OpenStreetMap allows one request per second. Please try again.",
      );
    }

    const results = await searchProvider(
      provider,
      { query, location, limit, includeContactDetails },
      env,
    );
    const payload = { provider, cached: false, results };
    const cacheResponse = json(payload, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
    waitUntil(caches.default.put(cacheKey, cacheResponse));
    return json(payload);
  } catch (error) {
    const status = error instanceof SyntaxError ? 400 : 502;
    return jsonError(status, error.message || "The lead source request failed.");
  }
}
