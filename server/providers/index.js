import { searchGooglePlaces } from "./googlePlaces.js";
import { searchOpenStreetMap } from "./openStreetMap.js";
import { searchPublicDirectory } from "./publicDirectory.js";
import { searchYelp } from "./yelp.js";

const providers = {
  google: searchGooglePlaces,
  openstreetmap: searchOpenStreetMap,
  yelp: searchYelp,
  directory: searchPublicDirectory,
};

export function searchProvider(provider, options) {
  const search = providers[provider];
  if (!search) throw new Error("Unsupported lead source.");
  return search(options);
}
