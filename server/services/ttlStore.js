export class TtlStore {
  constructor({ maxEntries = 200, ttlMs = 15 * 60_000 } = {}) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.entries = new Map();
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry || Date.now() - entry.createdAt > this.ttlMs) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value) {
    this.entries.set(key, { createdAt: Date.now(), value });
    while (this.entries.size > this.maxEntries) {
      this.entries.delete(this.entries.keys().next().value);
    }
  }

  take(key) {
    const value = this.get(key);
    this.entries.delete(key);
    return value;
  }
}
