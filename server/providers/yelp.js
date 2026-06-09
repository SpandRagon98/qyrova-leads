import { env } from "../config/env.js";
import { fetchJson } from "../lib/http.js";

export function normalizeYelpBusiness(business) {
  return {
    providerId: business.id,
    source: "Yelp",
    name: business.name,
    address: business.location?.display_address?.join(", ") || "",
    city: business.location?.city || "",
    state: business.location?.state || "",
    country: business.location?.country || "",
    phone: business.display_phone || business.phone || "",
    website: "",
    sourceUrl: business.url || "",
    category:
      business.categories?.map((category) => category.title).join(", ") || "",
    status: business.is_closed ? "CLOSED" : "OPERATIONAL",
  };
}

export async function searchYelp({ query, location, limit }) {
  if (!env.yelpApiKey) {
    throw new Error("Yelp is not configured on the integration server.");
  }
  const params = new URLSearchParams({
    term: query,
    location,
    limit: String(Math.min(limit, 20)),
    sort_by: "best_match",
  });
  const data = await fetchJson(
    `https://api.yelp.com/v3/businesses/search?${params}`,
    { headers: { Authorization: `Bearer ${env.yelpApiKey}` } },
  );
  return (data.businesses || []).map(normalizeYelpBusiness);
}
