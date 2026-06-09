import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const appUrl = (process.env.APP_URL || "http://127.0.0.1:4173").replace(/\/+$/, "");

export const env = Object.freeze({
  port: Number(process.env.PORT || 8787),
  host: process.env.HOST || "0.0.0.0",
  appUrl,
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  distDir: path.resolve(serverDir, "../../dist"),
  isProduction: process.env.NODE_ENV === "production",
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || "",
  yelpApiKey: process.env.YELP_API_KEY || "",
  osmContactEmail: process.env.OSM_CONTACT_EMAIL || "",
  osmNominatimUrl:
    process.env.OSM_NOMINATIM_URL || "https://nominatim.openstreetmap.org",
  directory: Object.freeze({
    name: process.env.DIRECTORY_NAME || "Public directory",
    urlTemplate: process.env.DIRECTORY_API_URL_TEMPLATE || "",
    apiKey: process.env.DIRECTORY_API_KEY || "",
    apiKeyHeader: process.env.DIRECTORY_API_KEY_HEADER || "Authorization",
    apiKeyPrefix: process.env.DIRECTORY_API_KEY_PREFIX || "Bearer",
    resultsPath: process.env.DIRECTORY_RESULTS_PATH || "results",
  }),
  linkedin: Object.freeze({
    clientId: process.env.LINKEDIN_CLIENT_ID || "",
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || "",
  }),
});

export function isLinkedInConfigured() {
  return Boolean(
    env.linkedin.clientId &&
      env.linkedin.clientSecret &&
      env.linkedin.redirectUri,
  );
}
