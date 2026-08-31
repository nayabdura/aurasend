import 'server-only';
import config from '../config';

const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

export class RateLimiter {
  /**
   * Distributed Upstash Redis or In-Memory Rate Limiter
   * @param key Unique key (e.g. login_IP, ai_user_12)
   * @param limit Maximum requests allowed in time window
   * @param windowMs Time window in milliseconds
   */
  static async check(key: string, limit: number, windowMs: number): Promise<boolean> {
    const redisUrl = config.upstash.redisRestUrl;
    const redisToken = config.upstash.redisRestToken;

    // Upstash Redis REST integration
    if (redisUrl && redisToken) {
      try {
        const windowSec = Math.ceil(windowMs / 1000);
        const res = await fetch(`${redisUrl}/incr/${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${redisToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          const count = Number(data.result || 1);

          if (count === 1) {
            await fetch(`${redisUrl}/expire/${encodeURIComponent(key)}/${windowSec}`, {
              headers: { Authorization: `Bearer ${redisToken}` },
            });
          }

          return count <= limit;
        }
      } catch (e) {
        console.error('[RateLimiter] Upstash Redis error, falling back to local store:', e);
      }
    }

    // Fallback: In-memory token bucket
    const now = Date.now();
    const current = inMemoryStore.get(key);

    if (!current || now > current.resetAt) {
      inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (current.count >= limit) {
      return false;
    }

    current.count += 1;
    return true;
  }
}

export default RateLimiter;
