import { json } from "../../_shared/http.js";

export function onRequestGet({ env }) {
  return json({
    google: {
      configured: Boolean(env.GOOGLE_PLACES_API_KEY),
      label: "Google Places",
      billingRequired: true,
    },
    openstreetmap: {
      configured: Boolean(env.OSM_CONTACT_EMAIL),
      label: "OpenStreetMap",
      attribution: "© OpenStreetMap contributors",
    },
    yelp: {
      configured: Boolean(env.YELP_API_KEY),
      label: "Yelp",
    },
    directory: {
      configured: Boolean(env.DIRECTORY_API_URL_TEMPLATE),
      label: env.DIRECTORY_NAME || "Public directory",
    },
    linkedin: {
      configured: Boolean(
        env.DB &&
          env.LINKEDIN_CLIENT_ID &&
          env.LINKEDIN_CLIENT_SECRET &&
          env.LINKEDIN_REDIRECT_URI,
      ),
      label: "LinkedIn OpenID Connect",
      leadSearchAvailable: false,
    },
    cloudSync: {
      configured: Boolean(env.DB),
      accessRequired: env.ALLOW_ANONYMOUS_SYNC !== "true",
    },
  });
}

