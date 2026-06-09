export function jsonError(res, status, message, details) {
  return res.status(status).json({
    error: message,
    ...(details ? { details } : {}),
  });
}

export function cleanText(value, max = 240) {
  return String(value || "").trim().slice(0, max);
}

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(15_000),
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
    const providerMessage =
      data?.error?.message ||
      data?.error?.description ||
      data?.message ||
      response.statusText;
    throw new Error(`${providerMessage} (${response.status})`);
  }
  return data;
}

export function getPath(object, pathValue) {
  return cleanText(pathValue)
    .split(".")
    .filter(Boolean)
    .reduce((value, part) => value?.[part], object);
}

export function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key]) => key)
      .map(([key, value]) => [key, decodeURIComponent(value || "")]),
  );
}
