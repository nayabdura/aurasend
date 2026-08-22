/**
 * Unified API Handler — Phases 12 + 13
 * Wraps every route handler with:
 *  - try/catch + structured error response
 *  - Request timing / performance logging
 *  - Consistent JSON error shape (error, code, details)
 *  - Auth helper
 *  - Typed error class support (ValidationError, NotFoundError, etc.)
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';
import { requireAuth } from './auth';
import { getStatusCode, isRedirectError } from './errorTypes';

export type ApiHandlerFn = (
  req: Request,
  context: { params?: Record<string, string>; user?: Awaited<ReturnType<typeof requireAuth>> }
) => Promise<NextResponse | Response>;

interface ApiHandlerOptions {
  /** If true, requireAuth() is called before the handler. User is passed in context. */
  requireAuth?: boolean;
  /** If true, only 'master' role is allowed */
  requireMaster?: boolean;
}

/**
 * Wraps a route handler with error handling + logging.
 *
 * @example
 * export const GET = createHandler(async (req, { user }) => {
 *   const data = db.prepare('SELECT ...').all();
 *   return NextResponse.json(data);
 * }, { requireAuth: true });
 */
export function createHandler(
  fn: ApiHandlerFn,
  opts: ApiHandlerOptions = {}
): (req: Request, ctx?: { params?: Record<string, string> }) => Promise<NextResponse> {
  return async (req: Request, ctx?: { params?: Record<string, string> }) => {
    const url = new URL(req.url);
    const startMs = Date.now();

    try {
      let user: Awaited<ReturnType<typeof requireAuth>> | undefined;

      if (opts.requireAuth || opts.requireMaster) {
        const { requireAuth: ra, requireMaster: rm } = await import('./auth');
        user = opts.requireMaster ? await rm() : await ra();
      }

      const result = await fn(req, { params: ctx?.params, user });
      const durationMs = Date.now() - startMs;

      logger.api(req.method, url.pathname, (result as NextResponse).status ?? 200, durationMs);
      return result as NextResponse;
    } catch (err: unknown) {
      // Let Next.js handle redirect() / notFound() throws
      if (isRedirectError(err)) throw err;

      const durationMs = Date.now() - startMs;
      const message = err instanceof Error ? err.message : 'Internal server error';
      const status = getStatusCode(err);

      // Only log 5xx as errors; 4xx as warnings
      if (status >= 500) {
        logger.error(`API Error: ${req.method} ${url.pathname} (${durationMs}ms) → ${status}`, {
          message,
          stack: err instanceof Error ? err.stack?.split('\n').slice(0, 5).join('\n') : undefined,
        }, 'api');
      } else {
        logger.warn(`API ${status}: ${req.method} ${url.pathname} (${durationMs}ms)`, { message }, 'api');
      }

      return NextResponse.json(
        {
          error: process.env.NODE_ENV === 'production' && status === 500 ? 'An error occurred' : message,
          code: status,
        },
        { status }
      );
    }
  };
}

/**
 * Standard success response
 */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Standard error response
 */
export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Validates required fields from a parsed body
 */
export function validateRequired(
  body: Record<string, unknown>,
  fields: string[]
): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}
