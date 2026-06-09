const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function workspaceRequest(options = {}) {
  const response = await fetch(`${apiBaseUrl}/api/workspace`, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Cloud sync failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export function loadCloudWorkspace() {
  return workspaceRequest();
}

export function saveCloudWorkspace(data) {
  return workspaceRequest({
    method: "PUT",
    body: JSON.stringify({ data }),
  });
}

