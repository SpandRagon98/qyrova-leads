import Papa from "papaparse";

export const LEAD_FIELD_OPTIONS = [
  ["", "Do not import"],
  ["firstName", "First name"],
  ["lastName", "Last name"],
  ["fullName", "Full name"],
  ["businessName", "Business name"],
  ["role", "Role / title"],
  ["industry", "Industry"],
  ["businessType", "Business type"],
  ["country", "Country"],
  ["state", "State / region"],
  ["city", "City"],
  ["linkedinUrl", "LinkedIn URL"],
  ["websiteUrl", "Website URL"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["leadSource", "Lead source"],
  ["notes", "Notes"],
  ["painPoint", "Pain point"],
  ["status", "Status"],
];

const aliases = {
  firstname: "firstName",
  first_name: "firstName",
  lastname: "lastName",
  last_name: "lastName",
  name: "fullName",
  fullname: "fullName",
  full_name: "fullName",
  company: "businessName",
  business: "businessName",
  businessname: "businessName",
  title: "role",
  jobtitle: "role",
  region: "state",
  state_region: "state",
  linkedin: "linkedinUrl",
  linkedinurl: "linkedinUrl",
  linkedin_profile_url: "linkedinUrl",
  website: "websiteUrl",
  websiteurl: "websiteUrl",
  source: "leadSource",
  painpoint: "painPoint",
  pain_point: "painPoint",
  businesstype: "businessType",
  business_type: "businessType",
};

export function guessField(header) {
  const key = header.toLowerCase().trim().replace(/[\s/-]+/g, "_");
  return aliases[key] || aliases[key.replaceAll("_", "")] || LEAD_FIELD_OPTIONS.find(([value]) => value.toLowerCase() === key.replaceAll("_", ""))?.[0] || "";
}

export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: ({ data, meta, errors }) => {
        if (errors.length && !data.length) reject(new Error(errors[0].message));
        else resolve({ rows: data, headers: meta.fields || [] });
      },
      error: reject,
    });
  });
}

export function mapCsvRows(rows, mapping) {
  return rows.map((row) => {
    const lead = {};
    Object.entries(mapping).forEach(([header, field]) => {
      if (field) lead[field] = String(row[header] ?? "").trim();
    });
    if (!lead.fullName) lead.fullName = `${lead.firstName || ""} ${lead.lastName || ""}`.trim();
    if (!lead.firstName && lead.fullName) lead.firstName = lead.fullName.split(" ")[0];
    return {
      ...lead,
      id: crypto.randomUUID(),
      status: lead.status || "New",
      createdAt: new Date().toISOString(),
      lastContacted: "",
      followUpDate: "",
    };
  });
}

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\/$/, "");
}

export function findDuplicate(existingLeads, incoming) {
  return existingLeads.find(
    (lead) =>
      (incoming.email && normalize(lead.email) === normalize(incoming.email)) ||
      (incoming.linkedinUrl && normalize(lead.linkedinUrl) === normalize(incoming.linkedinUrl)) ||
      (incoming.websiteUrl && normalize(lead.websiteUrl) === normalize(incoming.websiteUrl)) ||
      (incoming.sourceId && normalize(lead.sourceId) === normalize(incoming.sourceId)),
  );
}
