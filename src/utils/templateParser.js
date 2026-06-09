export function parseTemplate(template = "", lead = {}, settings = {}) {
  const values = {
    firstName: lead.firstName || lead.fullName?.split(" ")[0] || "there",
    fullName: lead.fullName || `${lead.firstName || ""} ${lead.lastName || ""}`.trim(),
    businessName: lead.businessName || "your business",
    industry: lead.industry || "your field",
    city: lead.city || "your area",
    country: lead.country || "",
    painPoint: lead.painPoint || "managing quotations and invoices",
    myProductName: settings.productName || "Qyrova",
    senderName: settings.senderName || settings.userName || "Qyrova Team",
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");
}
