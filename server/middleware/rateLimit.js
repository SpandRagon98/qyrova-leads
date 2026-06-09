import { jsonError } from "../lib/http.js";

export function createRateLimiter({ max = 30, windowMs = 60_000 } = {}) {
  const buckets = new Map();
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || "local";
    const now = Date.now();
    const recent = (buckets.get(key) || []).filter(
      (time) => now - time < windowMs,
    );
    if (recent.length >= max) {
      return jsonError(
        res,
        429,
        "Too many integration requests. Try again shortly.",
      );
    }
    recent.push(now);
    buckets.set(key, recent);
    if (buckets.size > 500) {
      for (const [bucketKey, times] of buckets) {
        if (!times.some((time) => now - time < windowMs)) buckets.delete(bucketKey);
      }
    }
    next();
  };
}
