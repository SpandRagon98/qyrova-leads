import Papa from "papaparse";

const exportColumns = [
  ["fullName", "Full Name"],
  ["businessName", "Business Name"],
  ["role", "Role"],
  ["industry", "Industry"],
  ["businessType", "Business Type"],
  ["country", "Country"],
  ["state", "State"],
  ["city", "City"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["linkedinUrl", "LinkedIn URL"],
  ["websiteUrl", "Website URL"],
  ["leadSource", "Lead Source"],
  ["leadScore", "Lead Score"],
  ["leadTemperature", "Lead Temperature"],
  ["status", "Status"],
  ["notes", "Notes"],
  ["lastContacted", "Last Contacted"],
  ["followUpDate", "Follow-up Date"],
];

function exportRows(leads) {
  return leads.map((lead) =>
    Object.fromEntries(exportColumns.map(([field, label]) => [label, lead[field] ?? ""])),
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportLeadsCsv(leads) {
  const csv = Papa.unparse(exportRows(leads));
  downloadBlob(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    `qyrova-leads-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}

export async function exportLeadsXlsx(leads) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const rows = exportRows(leads);
  const headers = exportColumns.map(([, label]) => ({
    value: label,
    fontWeight: "bold",
    backgroundColor: "#E6F3ED",
  }));
  const data = [
    headers,
    ...rows.map((row) => exportColumns.map(([, label]) => ({ value: row[label] }))),
  ];
  await writeXlsxFile(data, {
    fileName: `qyrova-leads-${new Date().toISOString().slice(0, 10)}.xlsx`,
    sheet: "Leads",
    columns: exportColumns.map(([, label]) => ({ width: Math.max(14, label.length + 3) })),
  });
}
