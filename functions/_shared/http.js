export function cleanText(value, max = 240) {
  return String(value || "").trim().slice(0, max);
}

export function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function jsonError(status, message, details) {
  return json(
    { error: message, ...(details ? { details } : {}) },
    { status },
  );
}

export async function readJson(request, maxBytes = 2_000_000) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > maxBytes) throw new Error("Request body is too large.");
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    throw new Error("Request body is too large.");
  }
  return text ? JSON.parse(text) : {};
}

export async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Provider returned non-JSON data (${response.status}).`);
    }
    if (!response.ok) {
      const message =
        data?.error?.message ||
        data?.error?.description ||
        data?.message ||
        response.statusText;
      throw new Error(`${message} (${response.status})`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export function getPath(object, pathValue) {
  return cleanText(pathValue)
    .split(".")
    .filter(Boolean)
    .reduce((value, part) => value?.[part], object);
}

export function parseCookies(request) {
  return Object.fromEntries(
    String(request.headers.get("Cookie") || "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key]) => key)
      .map(([key, value]) => [key, decodeURIComponent(value || "")]),
  );
}

export function requestOrigin(request, env) {
  return String(env.APP_URL || new URL(request.url).origin).replace(/\/+$/, "");
}

export function secureCookie(request) {
  return new URL(request.url).protocol === "https:" ? "; Secure" : "";
}
