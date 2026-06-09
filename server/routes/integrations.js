import { Router } from "express";
import { env, isLinkedInConfigured } from "../config/env.js";
import { cleanText, jsonError } from "../lib/http.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { searchProvider } from "../providers/index.js";
import { TtlStore } from "../services/ttlStore.js";

const router = Router();
const cache = new TtlStore();
const rateLimit = createRateLimiter();

router.get("/status", (_req, res) => {
  res.json({
    google: {
      configured: Boolean(env.googlePlacesApiKey),
      label: "Google Places",
      billingRequired: true,
    },
    openstreetmap: {
      configured: Boolean(env.osmContactEmail),
      label: "OpenStreetMap",
      attribution: "© OpenStreetMap contributors",
    },
    yelp: {
      configured: Boolean(env.yelpApiKey),
      label: "Yelp",
    },
    directory: {
      configured: Boolean(env.directory.urlTemplate),
      label: env.directory.name,
    },
    linkedin: {
      configured: isLinkedInConfigured(),
      label: "LinkedIn OpenID Connect",
      leadSearchAvailable: false,
    },
  });
});

router.post("/search", rateLimit, async (req, res) => {
  const provider = cleanText(req.body?.provider, 40).toLowerCase();
  const query = cleanText(req.body?.query);
  const location = cleanText(req.body?.location);
  const limit = Math.max(1, Math.min(Number(req.body?.limit) || 10, 20));
  const includeContactDetails = Boolean(req.body?.includeContactDetails);
  if (!query) return jsonError(res, 400, "Enter a business type or search keyword.");
  if (!location) return jsonError(res, 400, "Enter a city, region, or country.");

  const cacheKey = JSON.stringify({
    provider,
    query,
    location,
    limit,
    includeContactDetails,
  });
  const cachedResults = cache.get(cacheKey);
  if (cachedResults) {
    return res.json({ provider, cached: true, results: cachedResults });
  }

  try {
    const results = await searchProvider(provider, {
      query,
      location,
      limit,
      includeContactDetails,
    });
    cache.set(cacheKey, results);
    res.json({ provider, cached: false, results });
  } catch (error) {
    jsonError(res, 502, error.message || "The lead source request failed.");
  }
});

export default router;
