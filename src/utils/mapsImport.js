import Papa from "papaparse";

function firstValue(record, names) {
  const entries = Object.entries(record || {});
  for (const name of names) {
    const match = entries.find(([key]) => key.toLowerCase().trim() === name.toLowerCase());
    if (match && match[1] !== undefined && match[1] !== null) return String(match[1]).trim();
  }
  return "";
}

function getFirstUrl(text = "") {
  return String(text).match(/https?:\/\/[^\s"<]+/i)?.[0] || "";
}

function normalizePlace(record, source = "Google Maps export") {
  const name = firstValue(record, [
    "Business Name",
    "Name",
    "Title",
    "Location",
    "Place",
    "name",
  ]);
  const address = firstValue(record, [
    "Address",
    "Full Address",
    "Formatted Address",
    "Location Address",
    "address",
  ]);
  const website = firstValue(record, ["Website", "Website URL", "Site", "website"]);
  const mapsUrl = firstValue(record, [
    "Google Maps URL",
    "Google Maps Link",
    "Maps URL",
    "URL",
    "Link",
    "url",
  ]);
  const phone = firstValue(record, ["Phone", "Phone Number", "Telephone", "phone"]);
  const category = firstValue(record, ["Category", "Type", "Industry", "category"]);
  const notes = [address && `Address: ${address}`, mapsUrl && `Source: ${mapsUrl}`]
    .filter(Boolean)
    .join("\n");

  if (!name && !address) return null;
  return {
    id: crypto.randomUUID(),
    sourceId: mapsUrl || `${source}:${name}:${address}`,
    firstName: "",
    lastName: "",
    fullName: name || address.split(",")[0],
    businessName: name || address.split(",")[0],
    role: "Business contact",
    industry: category,
    businessType: "Small Business",
    country: firstValue(record, ["Country", "country"]),
    state: firstValue(record, ["State", "Region", "state"]),
    city: firstValue(record, ["City", "Locality", "city"]),
    linkedinUrl: "",
    websiteUrl: website,
    email: firstValue(record, ["Email", "email"]),
    phone,
    leadSource: source,
    notes,
    painPoint: "",
    status: "New",
    createdAt: new Date().toISOString(),
    lastContacted: "",
    followUpDate: "",
  };
}

function parseCsv(text) {
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length && !parsed.data.length) throw new Error(parsed.errors[0].message);
  return parsed.data.map((record) => normalizePlace(record)).filter(Boolean);
}

function flattenJson(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.features)) {
    return data.features.map((feature) => ({
      ...(feature.properties || {}),
      ...(feature.properties?.Location || {}),
      name:
        feature.properties?.Title ||
        feature.properties?.name ||
        feature.properties?.Location?.["Business Name"],
      address:
        feature.properties?.Location?.Address ||
        feature.properties?.address ||
        feature.properties?.description,
      url:
        feature.properties?.["Google Maps URL"] ||
        feature.properties?.url ||
        feature.properties?.Location?.["Google Maps URL"],
    }));
  }
  const arrayValue = Object.values(data || {}).find((value) => Array.isArray(value));
  return arrayValue || [data];
}

function parseJson(text) {
  return flattenJson(JSON.parse(text))
    .map((record) => normalizePlace(record, "Google Maps JSON export"))
    .filter(Boolean);
}

function parseKml(text) {
  const documentXml = new DOMParser().parseFromString(text, "application/xml");
  if (documentXml.querySelector("parsererror")) throw new Error("The KML file could not be parsed.");
  return [...documentXml.querySelectorAll("Placemark")]
    .map((placemark) => {
      const name = placemark.querySelector("name")?.textContent?.trim() || "";
      const address = placemark.querySelector("address")?.textContent?.trim() || "";
      const description = placemark.querySelector("description")?.textContent || "";
      const fields = Object.fromEntries(
        [...placemark.querySelectorAll("Data")].map((node) => [
          node.getAttribute("name") || "",
          node.querySelector("value")?.textContent || "",
        ]),
      );
      return normalizePlace(
        {
          ...fields,
          Name: name,
          Address: address || fields.address,
          "Google Maps URL": getFirstUrl(description),
          Website: fields.website || fields.Website,
          Phone: fields.phone || fields.Phone,
        },
        "Google My Maps KML",
      );
    })
    .filter(Boolean);
}

export async function parseGoogleMapsExport(file) {
  const text = await file.text();
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "csv" || extension === "tsv") return parseCsv(text);
  if (extension === "json") return parseJson(text);
  if (extension === "kml") return parseKml(text);
  throw new Error("Use a Google Maps CSV, TSV, JSON, or KML export.");
}

export function sourceResultToLead(result, criteria = {}) {
  return {
    id: crypto.randomUUID(),
    sourceId: `${result.source}:${result.providerId}`,
    firstName: "",
    lastName: "",
    fullName: result.name,
    businessName: result.name,
    role: "Business contact",
    industry: result.category || criteria.industry || "",
    businessType: criteria.businessType || "Small Business",
    country: result.country || criteria.country || "",
    state: result.state || criteria.state || "",
    city: result.city || criteria.city || "",
    linkedinUrl: "",
    websiteUrl: result.website || "",
    email: "",
    phone: result.phone || "",
    leadSource: result.source,
    notes: [
      result.address && `Address: ${result.address}`,
      result.sourceUrl && `Source profile: ${result.sourceUrl}`,
      result.status && `Provider status: ${result.status}`,
    ]
      .filter(Boolean)
      .join("\n"),
    painPoint: criteria.painPoint || "",
    status: "New",
    createdAt: new Date().toISOString(),
    lastContacted: "",
    followUpDate: "",
  };
}
