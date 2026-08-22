/**
 * Production Logger — Phase 13
 * Structured logging: error, api, performance, system
 * Writes to DB + console with context tagging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';
type LogCategory = 'system' | 'api' | 'email' | 'auth' | 'campaign' | 'warmup' | 'perf' | 'db';

interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: unknown;
  durationMs?: number;
}

// Lazy-import db to avoid circular dependency on cold start
function getDb() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('./db').default;
}

function serialize(details: unknown): string | null {
  if (details === undefined || details === null) return null;
  if (typeof details === 'string') return details;
  try {
    return JSON.stringify(details, null, 0);
  } catch {
    return String(details);
  }
}

export function log(
  level: LogLevel,
  message: string,
  details?: unknown,
  category: LogCategory = 'system'
): void {
  const detailStr = serialize(details);
  const prefix = `[${category.toUpperCase()}][${level.toUpperCase()}]`;

  // Console output
  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (detailStr) {
    consoleFn(`${prefix} ${message}`, detailStr);
  } else {
    consoleFn(`${prefix} ${message}`);
  }

  // DB persistence — non-blocking, fire-and-forget
  try {
    getDb()
      .prepare(
        'INSERT INTO system_logs (level, message, details, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
      )
      .run(`${category}:${level}`, message, detailStr);
  } catch {
    // Silently fail — never let logging crash the app
  }
}

// Convenience wrappers
export const logger = {
  info: (msg: string, details?: unknown, cat?: LogCategory) => log('info', msg, details, cat),
  warn: (msg: string, details?: unknown, cat?: LogCategory) => log('warn', msg, details, cat),
  error: (msg: string, details?: unknown, cat?: LogCategory) => log('error', msg, details, cat),
  success: (msg: string, details?: unknown, cat?: LogCategory) => log('success', msg, details, cat),
  debug: (msg: string, details?: unknown, cat?: LogCategory) => {
    if (process.env.NODE_ENV !== 'production') log('debug', msg, details, cat);
  },

  /** API request logger */
  api: (method: string, path: string, statusCode: number, durationMs?: number) =>
    log(
      statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info',
      `${method} ${path} → ${statusCode}${durationMs != null ? ` (${durationMs}ms)` : ''}`,
      undefined,
      'api'
    ),

  /** Performance logger */
  perf: (label: string, durationMs: number, meta?: unknown) =>
    log(
      durationMs > 2000 ? 'warn' : 'info',
      `PERF: ${label} took ${durationMs}ms`,
      meta,
      'perf'
    ),

  /** Email operation logger */
  email: (msg: string, details?: unknown) => log('info', msg, details, 'email'),

  /** Auth event logger */
  auth: (msg: string, details?: unknown) => log('info', msg, details, 'auth'),
};

/**
 * Performance timer utility
 * Usage:
 *   const timer = startTimer('db-query');
 *   // ... do work
 *   timer.end({ rows: 42 });
 */
export function startTimer(label: string) {
  const start = Date.now();
  return {
    end(meta?: unknown) {
      const durationMs = Date.now() - start;
      logger.perf(label, durationMs, meta);
      return durationMs;
    },
  };
}

export function getLogs(limit = 100, category?: string) {
  try {
    if (category) {
      return getDb()
        .prepare("SELECT * FROM system_logs WHERE level LIKE ? ORDER BY id DESC LIMIT ?")
        .all(`${category}:%`, limit);
    }
    return getDb()
      .prepare('SELECT * FROM system_logs ORDER BY id DESC LIMIT ?')
      .all(limit);
  } catch {
    return [];
  }
}
