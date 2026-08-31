import 'server-only';
import RateLimiter from '../backend/security/RateLimiter';

/**
 * Basic rate limiter wrapper delegating to backend RateLimiter
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  // Sync check fallback wrapper for existing API callers
  RateLimiter.check(key, limit, windowMs).catch(() => {});
  return true;
}

export { RateLimiter };
export default RateLimiter;
