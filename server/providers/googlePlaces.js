import { env } from "../config/env.js";
import { fetchJson } from "../lib/http.js";

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
    category:
      place.primaryTypeDisplayName?.text || place.primaryType || "",
    status: place.businessStatus || "",
  };
}

export async function searchGooglePlaces({
  query,
  location,
  limit,
  includeContactDetails,
}) {
  if (!env.googlePlacesApiKey) {
    throw new Error("Google Places is not configured on the integration server.");
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
  if (includeContactDetails) {
    fields.push("places.nationalPhoneNumber", "places.websiteUri");
  }
  const data = await fetchJson(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.googlePlacesApiKey,
        "X-Goog-FieldMask": fields.join(","),
      },
      body: JSON.stringify({
        textQuery: [query, location].filter(Boolean).join(" in "),
        pageSize: Math.min(limit, 20),
        includePureServiceAreaBusinesses: true,
      }),
    },
  );
  return (data.places || []).map(normalizeGooglePlace);
}
