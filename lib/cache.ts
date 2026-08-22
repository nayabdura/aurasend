/**
 * In-memory cache with TTL — Phase 14
 * Lightweight alternative to Redis for single-server SQLite deployments.
 * No external dependencies.
 *
 * Features:
 *  - TTL-based expiry
 *  - Manual invalidation by key or tag
 *  - Cache-or-fetch helper
 *  - Automatic stale entry GC
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;   // Date.now() + ttlMs
  tags: string[];
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private gcInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // GC every 5 minutes — remove expired entries
    if (typeof setInterval !== 'undefined') {
      this.gcInterval = setInterval(() => this.gc(), 5 * 60 * 1000);
    }
  }

  set<T>(key: string, data: T, ttlMs: number, tags: string[] = []): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs, tags });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  /** Invalidate all entries that have ANY of the given tags */
  invalidateByTags(tags: string[]): void {
    const tagSet = new Set(tags);
    for (const [key, entry] of Array.from(this.store.entries())) {
      if (entry.tags.some((t: string) => tagSet.has(t))) {
        this.store.delete(key);
      }
    }
  }

  /** Invalidate all entries whose key starts with prefix */
  invalidateByPrefix(prefix: string): void {
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  flush(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  private gc(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.store.entries())) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

// Singleton instance
export const cache = new MemoryCache();

// ─── Prebuilt TTL constants ────────────────────────────────────────────────
export const TTL = {
  /** 30 seconds — dashboard stats */
  SHORT: 30_000,
  /** 2 minutes — list pages */
  MEDIUM: 2 * 60_000,
  /** 5 minutes — analytics aggregates */
  LONG: 5 * 60_000,
  /** 30 minutes — static config */
  HOUR: 30 * 60_000,
} as const;

/**
 * Cache-or-fetch helper.
 * If key exists in cache → return it.
 * Otherwise call fetcher(), store result, return it.
 *
 * @example
 * const leads = await cacheOrFetch(
 *   `leads:${userId}`,
 *   () => db.prepare('SELECT * FROM leads WHERE user_id = ?').all(userId),
 *   TTL.MEDIUM,
 *   ['leads', `user:${userId}`]
 * );
 */
export async function cacheOrFetch<T>(
  key: string,
  fetcher: () => T | Promise<T>,
  ttlMs: number = TTL.MEDIUM,
  tags: string[] = []
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  cache.set(key, data, ttlMs, tags);
  return data;
}

/**
 * Cache invalidation helpers — call these after mutations
 */
export const invalidate = {
  user: (userId: number) => cache.invalidateByTags([`user:${userId}`]),
  leads: (userId: number) => cache.invalidateByPrefix(`leads:${userId}`),
  campaigns: (userId: number) => cache.invalidateByPrefix(`campaigns:${userId}`),
  contacts: (userId: number) => cache.invalidateByPrefix(`contacts:${userId}`),
  dashboard: (userId: number) => cache.invalidateByPrefix(`dashboard:${userId}`),
  settings: () => cache.invalidateByPrefix('settings:'),
  all: () => cache.flush(),
};
