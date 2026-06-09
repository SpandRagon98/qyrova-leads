import { describe, expect, it } from "vitest";
import { normalizeGooglePlace } from "./googlePlaces";
import { normalizeOpenStreetMapPlace } from "./openStreetMap";
import { normalizeYelpBusiness } from "./yelp";

describe("provider normalization", () => {
  it("normalizes Google Places records", () => {
    const result = normalizeGooglePlace({
      id: "place-1",
      displayName: { text: "North Studio" },
      formattedAddress: "10 Lake Road",
      websiteUri: "https://north.test",
    });

    expect(result).toMatchObject({
      providerId: "place-1",
      name: "North Studio",
      website: "https://north.test",
    });
  });

  it("normalizes Yelp records", () => {
    const result = normalizeYelpBusiness({
      id: "yelp-1",
      name: "Signal Agency",
      location: { city: "Austin", display_address: ["1 Main St"] },
      categories: [{ title: "Marketing" }],
    });

    expect(result.city).toBe("Austin");
    expect(result.category).toBe("Marketing");
  });

  it("normalizes OpenStreetMap address details", () => {
    const result = normalizeOpenStreetMapPlace({
      osm_type: "node",
      osm_id: 42,
      display_name: "Repair Hub, Pune, India",
      address: { city: "Pune", country: "India" },
      extratags: {},
    });

    expect(result).toMatchObject({
      providerId: "node-42",
      name: "Repair Hub",
      city: "Pune",
      country: "India",
    });
  });
});
