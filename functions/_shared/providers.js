import { cleanText, fetchJson, getPath } from "./http.js";

export function normalizeGooglePlace(place) {
  return {
    providerId: place.id,
    source: "Google Places",
    name: place.displayName?.text || "Unnamed business",
    address: place.formattedAddress || "",
    city: "",
    state: "",
    country: "",
    phone: place.nationalPhoneNumber || "",
    website: place.websiteUri || "",
    sourceUrl: place.googleMapsUri || "",
    category: place.primaryTypeDisplayName?.text || place.primaryType || "",
    status: place.businessStatus || "",
  };
}

async function searchGooglePlaces(options, env) {
  if (!env.GOOGLE_PLACES_API_KEY) {
    throw new Error("Google Places is not configured.");
  }
  const fields = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.googleMapsUri",
    "places.primaryType",
    "places.primaryTypeDisplayName",
    "places.businessStatus",
  ];
  if (options.includeContactDetails) {
    fields.push("places.nationalPhoneNumber", "places.websiteUri");
  }
  const data = await fetchJson(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": fields.join(","),
      },
      body: JSON.stringify({
        textQuery: `${options.query} in ${options.location}`,
        pageSize: Math.min(options.limit, 20),
        includePureServiceAreaBusinesses: true,
      }),
    },
  );
  return (data.places || []).map(normalizeGooglePlace);
}

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

async function searchYelp(options, env) {
  if (!env.YELP_API_KEY) throw new Error("Yelp is not configured.");
  const params = new URLSearchParams({
    term: options.query,
    location: options.location,
    limit: String(Math.min(options.limit, 20)),
    sort_by: "best_match",
  });
  const data = await fetchJson(
    `https://api.yelp.com/v3/businesses/search?${params}`,
    { headers: { Authorization: `Bearer ${env.YELP_API_KEY}` } },
  );
  return (data.businesses || []).map(normalizeYelpBusiness);
}

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
    phone: place.extratags?.phone || place.extratags?.["contact:phone"] || "",
    website:
      place.extratags?.website ||
      place.extratags?.["contact:website"] ||
      "",
    sourceUrl: `https://www.openstreetmap.org/${place.osm_type}/${place.osm_id}`,
    category: place.type || place.category || "",
    status: "",
  };
}

async function searchOpenStreetMap(options, env) {
  const contact = cleanText(env.OSM_CONTACT_EMAIL, 160);
  if (!contact) {
    throw new Error("Set OSM_CONTACT_EMAIL before using OpenStreetMap.");
  }
  const params = new URLSearchParams({
    q: `${options.query}, ${options.location}`,
    format: "jsonv2",
    addressdetails: "1",
    extratags: "1",
    namedetails: "1",
    limit: String(Math.min(options.limit, 10)),
  });
  const baseUrl = env.OSM_NOMINATIM_URL || "https://nominatim.openstreetmap.org";
  const data = await fetchJson(`${baseUrl.replace(/\/$/, "")}/search?${params}`, {
    headers: {
      "User-Agent": `Qyrova-Leads/1.0 (${contact})`,
      Referer: env.APP_URL || "https://qyrova-leads.pages.dev",
    },
  });
  return (Array.isArray(data) ? data : []).map(normalizeOpenStreetMapPlace);
}

function normalizeDirectoryItem(item, index, sourceName) {
  const address = item.location || item.address || {};
  return {
    providerId: cleanText(item.id || item.place_id || item.slug || index),
    source: sourceName,
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

async function searchPublicDirectory(options, env) {
  if (!env.DIRECTORY_API_URL_TEMPLATE) {
    throw new Error("No permitted public directory is configured.");
  }
  const url = env.DIRECTORY_API_URL_TEMPLATE
    .replaceAll("{query}", encodeURIComponent(options.query))
    .replaceAll("{location}", encodeURIComponent(options.location))
    .replaceAll("{limit}", String(Math.min(options.limit, 20)));
  const headers = {};
  if (env.DIRECTORY_API_KEY) {
    const header = env.DIRECTORY_API_KEY_HEADER || "Authorization";
    headers[header] = [
      cleanText(env.DIRECTORY_API_KEY_PREFIX || "Bearer"),
      env.DIRECTORY_API_KEY,
    ]
      .filter(Boolean)
      .join(" ");
  }
  const data = await fetchJson(url, { headers });
  const results = getPath(data, env.DIRECTORY_RESULTS_PATH || "results");
  if (!Array.isArray(results)) {
    throw new Error("Custom directory result path is not an array.");
  }
  const sourceName = env.DIRECTORY_NAME || "Public directory";
  return results
    .slice(0, options.limit)
    .map((item, index) => normalizeDirectoryItem(item, index, sourceName));
}

const providers = {
  google: searchGooglePlaces,
  openstreetmap: searchOpenStreetMap,
  yelp: searchYelp,
  directory: searchPublicDirectory,
};

export function searchProvider(provider, options, env) {
  const search = providers[provider];
  if (!search) throw new Error("Unsupported lead source.");
  return search(options, env);
}

