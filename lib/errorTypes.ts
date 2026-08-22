/**
 * Typed Application Errors — Phase 12
 * Use these instead of raw `throw new Error('...')` for consistent HTTP status mapping.
 *
 * The createHandler() wrapper in apiHandler.ts checks `instanceof` on these
 * to map to the correct HTTP status code automatically.
 */

/** 400 — client sent invalid data */
export class ValidationError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** 401 — not logged in */
export class AuthenticationError extends Error {
  readonly statusCode = 401;
  constructor(message = 'Not authenticated') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/** 403 — logged in but lacks permission */
export class AuthorizationError extends Error {
  readonly statusCode = 403;
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/** 404 — resource not found */
export class NotFoundError extends Error {
  readonly statusCode = 404;
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/** 409 — conflict (e.g. duplicate email) */
export class ConflictError extends Error {
  readonly statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/** 422 — business logic / unprocessable entity */
export class UnprocessableError extends Error {
  readonly statusCode = 422;
  constructor(message: string) {
    super(message);
    this.name = 'UnprocessableError';
  }
}

/** 429 — rate limit exceeded */
export class RateLimitError extends Error {
  readonly statusCode = 429;
  constructor(message = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

/** 500 — internal server error */
export class InternalError extends Error {
  readonly statusCode = 500;
  constructor(message = 'Internal server error') {
    super(message);
    this.name = 'InternalError';
  }
}

/** Extract HTTP status from a typed app error, falling back to 500 */
export function getStatusCode(err: unknown): number {
  if (err instanceof ValidationError) return err.statusCode;
  if (err instanceof AuthenticationError) return err.statusCode;
  if (err instanceof AuthorizationError) return err.statusCode;
  if (err instanceof NotFoundError) return err.statusCode;
  if (err instanceof ConflictError) return err.statusCode;
  if (err instanceof UnprocessableError) return err.statusCode;
  if (err instanceof RateLimitError) return err.statusCode;
  if (err instanceof InternalError) return err.statusCode;
  return 500;
}

/** Check if an error is a redirect (Next.js throws for redirect()) */
export function isRedirectError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.message === 'NEXT_REDIRECT' || err.message.includes('redirect');
}
