import { env } from "../config/env.js";
import { cleanText, fetchJson, getPath } from "../lib/http.js";

export function normalizeDirectoryItem(item, index) {
  const address = item.location || item.address || {};
  return {
    providerId: cleanText(item.id || item.place_id || item.slug || index),
    source: env.directory.name,
    name: cleanText(
      item.name || item.title || item.business_name || "Unnamed business",
    ),
    address: cleanText(
      typeof address === "string"
        ? address
        : address.formatted_address || address.display_address?.join(", ") || "",
    ),
    city: cleanText(address.city || item.city),
    state: cleanText(address.state || item.state),
    country: cleanText(address.country || item.country),
    phone: cleanText(item.phone || item.display_phone),
    website: cleanText(item.website || item.website_url || item.url),
    sourceUrl: cleanText(item.profile_url || item.source_url || item.url),
    category: cleanText(
      item.category ||
        item.industry ||
        item.categories
          ?.map?.((entry) => entry.title || entry.name || entry)
          .join(", "),
    ),
    status: "",
  };
}

export async function searchPublicDirectory({ query, location, limit }) {
  if (!env.directory.urlTemplate) {
    throw new Error("No custom public directory is configured.");
  }
  const url = env.directory.urlTemplate
    .replaceAll("{query}", encodeURIComponent(query))
    .replaceAll("{location}", encodeURIComponent(location))
    .replaceAll("{limit}", String(Math.min(limit, 20)));
  const headers = {};
  if (env.directory.apiKey) {
    headers[env.directory.apiKeyHeader] = [
      cleanText(env.directory.apiKeyPrefix),
      env.directory.apiKey,
    ]
      .filter(Boolean)
      .join(" ");
  }
  const data = await fetchJson(url, { headers });
  const rawResults = getPath(data, env.directory.resultsPath);
  if (!Array.isArray(rawResults)) {
    throw new Error("Custom directory result path is not an array.");
  }
  return rawResults
    .slice(0, limit)
    .map((item, index) => normalizeDirectoryItem(item, index));
}
