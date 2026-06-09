const STORAGE_KEY = "qyrova-leads-v1";

export function loadAppData(fallback) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return {
      ...fallback,
      ...parsed,
      settings: { ...fallback.settings, ...parsed.settings },
    };
  } catch {
    return fallback;
  }
}

export function saveAppData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearAppData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function downloadBackup(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `qyrova-leads-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readBackup(file) {
  const data = JSON.parse(await file.text());
  if (!data || !Array.isArray(data.leads) || !Array.isArray(data.templates)) {
    throw new Error("This file is not a valid Qyrova Leads backup.");
  }
  return data;
}
