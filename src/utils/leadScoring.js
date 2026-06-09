const ICP_INDUSTRIES = [
  "design",
  "marketing",
  "web development",
  "interior design",
  "consulting",
  "photography",
  "events",
  "contracting",
  "tax",
  "legal",
  "repair",
];

const HIGH_INTENT_ROLES = ["founder", "owner", "freelancer", "consultant", "director"];
const ICP_BUSINESS_TYPES = ["freelancer", "agency", "small business", "consultant"];
const PAIN_KEYWORDS = ["quotation", "invoice", "estimate", "proposal", "client billing", "manual billing"];

export function calculateLeadScore(lead, targetCountries = []) {
  let score = 0;
  if (lead.email) score += 15;
  if (lead.linkedinUrl) score += 10;
  if (lead.websiteUrl) score += 10;

  const role = (lead.role || "").toLowerCase();
  if (HIGH_INTENT_ROLES.some((word) => role.includes(word))) score += 20;

  const industry = (lead.industry || "").toLowerCase();
  if (ICP_INDUSTRIES.some((word) => industry.includes(word))) score += 20;

  const businessType = (lead.businessType || "").toLowerCase();
  if (ICP_BUSINESS_TYPES.some((word) => businessType.includes(word))) score += 20;

  const intentText = `${lead.notes || ""} ${lead.painPoint || ""}`.toLowerCase();
  if (PAIN_KEYWORDS.some((word) => intentText.includes(word))) score += 25;

  if (targetCountries.some((country) => country.toLowerCase() === (lead.country || "").toLowerCase())) {
    score += 5;
  }

  if (!lead.email && !lead.linkedinUrl && !lead.phone) score -= 10;
  return Math.max(0, Math.min(score, 100));
}

export function getLeadTemperature(score) {
  if (score >= 70) return "Hot";
  if (score >= 40) return "Warm";
  return "Cold";
}

export function enrichLead(lead, targetCountries = []) {
  const leadScore = calculateLeadScore(lead, targetCountries);
  return { ...lead, leadScore, leadTemperature: getLeadTemperature(leadScore) };
}
