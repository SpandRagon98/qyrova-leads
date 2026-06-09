const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function requestJson(url, options) {
  const response = await fetch(`${apiBaseUrl}${url}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

export function getIntegrationStatus() {
  return requestJson("/api/integrations/status");
}

export function searchLeadSource(provider, search) {
  return requestJson("/api/integrations/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, ...search }),
  });
}

export function getLinkedInConnectUrl() {
  return `${apiBaseUrl}/api/linkedin/connect`;
}

export function consumeLinkedInSession(ticket) {
  return requestJson(`/api/linkedin/session?ticket=${encodeURIComponent(ticket)}`);
}
