import { env } from "../config/env.js";
import { cleanText, fetchJson } from "../lib/http.js";

let lastRequestAt = 0;

function splitAddressParts(address = {}) {
  return {
    city:
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      "",
    state: address.state || address.region || "",
    country: address.country || "",
  };
}

async function waitForPublicServiceSlot() {
  const delay = 1_050 - (Date.now() - lastRequestAt);
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  lastRequestAt = Date.now();
}

export function normalizeOpenStreetMapPlace(place) {
  return {
    providerId: `${place.osm_type}-${place.osm_id}`,
    source: "OpenStreetMap",
    name:
      place.namedetails?.name ||
      place.name ||
      place.display_name?.split(",")[0] ||
      "Unnamed place",
    address: place.display_name || "",
    ...splitAddressParts(place.address || {}),
    phone:
      place.extratags?.phone || place.extratags?.["contact:phone"] || "",
    website:
      place.extratags?.website ||
      place.extratags?.["contact:website"] ||
      "",
    sourceUrl: `https://www.openstreetmap.org/${place.osm_type}/${place.osm_id}`,
    category: place.type || place.category || "",
    status: "",
  };
}

export async function searchOpenStreetMap({ query, location, limit }) {
  const contact = cleanText(env.osmContactEmail, 160);
  if (!contact) {
    throw new Error("Set OSM_CONTACT_EMAIL before using OpenStreetMap search.");
  }
  await waitForPublicServiceSlot();
  const params = new URLSearchParams({
    q: [query, location].filter(Boolean).join(", "),
    format: "jsonv2",
    addressdetails: "1",
    extratags: "1",
    namedetails: "1",
    limit: String(Math.min(limit, 10)),
  });
  const data = await fetchJson(
    `${env.osmNominatimUrl.replace(/\/$/, "")}/search?${params}`,
    {
      headers: {
        "User-Agent": `Qyrova-Leads/1.0 (${contact})`,
        Referer: env.appUrl,
      },
    },
  );
  return (Array.isArray(data) ? data : []).map(normalizeOpenStreetMapPlace);
}
