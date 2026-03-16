/**
 * Lightweight in-memory cache utility with TTL support.
 * Designed for API response caching to reduce database load.
 */
class APICache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Set a value in the cache with a specific TTL.
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlMinutes - Time to live in minutes.
   */
  set(key, value, ttlMinutes = 30) {
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get a value from the cache if it exists and hasn't expired.
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Remove a specific key from the cache.
   * @param {string} key 
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache.
   */
  clear() {
    this.cache.clear();
  }
}

// Global instance to persist across HMR in dev if needed (singleton pattern)
if (!global._apiCache) {
  global._apiCache = new APICache();
}

export const apiCache = global._apiCache;
