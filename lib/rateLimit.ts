const rateLimiter = new Map<string, { count: number, resetAt: number }>();

/**
 * Basic in-memory rate limiter per IP/Key
 * @param key The unique key to rate limit on (usually IP or User ID)
 * @param limit Max requests allowed in the time window
 * @param windowMs Time window in milliseconds
 * @returns true if allowed, false if blocked
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const current = rateLimiter.get(key);
    
    if (!current) {
        rateLimiter.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }
    
    if (now > current.resetAt) {
        rateLimiter.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }
    
    if (current.count >= limit) {
        return false;
    }
    
    current.count += 1;
    return true;
}

// Garbage collection for the memory map
export function cleanupRateLimiter() {
    const now = Date.now();
    Array.from(rateLimiter.entries()).forEach(([key, data]) => {
        if (now > data.resetAt) {
            rateLimiter.delete(key);
        }
    });
}

// Clean up every 15 minutes to avoid memory leaks
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupRateLimiter, 15 * 60 * 1000);
}
