import 'server-only';

/**
 * Deterministically resolves the application base URL for production and development environments.
 * Supports reverse proxies (x-forwarded-proto, x-forwarded-host) and explicit environment variables.
 */
export function getAppBaseUrl(req?: Request): string {
  // 1. Explicit env vars (Highest Priority)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, '');
  }
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.trim().replace(/\/$/, '');
  }

  // 2. Request Headers (Proxy Aware)
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      return `${proto}://${host}`.replace(/\/$/, '');
    }

    try {
      const origin = new URL(req.url).origin;
      if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return (process.env.NODE_ENV === 'production' ? origin.replace(/^http:/, 'https:') : origin).replace(/\/$/, '');
      }
    } catch {}
  }

  // 3. Environment Fallbacks
  if (process.env.NODE_ENV === 'production') {
    return 'https://aurasend.vercel.app';
  }

  return 'http://localhost:3000';
}

export default getAppBaseUrl;
