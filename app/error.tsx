'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-segment error boundary (app/error.tsx)
 * Shown when a server component or async operation throws.
 */
const ErrorBoundary = memo(function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (reported) return;
    // Log to server-side logging endpoint
    fetch('/api/logs/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {}); // Never let error reporting crash the page

    console.error('[ErrorBoundary]', error);
    setReported(true);
  }, [error, reported]);

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-[40vh] p-12 bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 rounded-2xl border border-slate-200 dark:border-zinc-800 dark:border-zinc-800 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-5">
        <AlertTriangle className="h-8 w-8 text-orange-500" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-2">Something went wrong</h2>
      <p className="text-slate-500 dark:text-zinc-50 text-sm mb-2 max-w-md">
        We ran into an unexpected issue loading this section. The error has been logged automatically.
      </p>

      {/* Show digest in production for support references */}
      {error.digest && (
        <p className="text-xs text-gray-400 mb-6 font-mono bg-slate-100 dark:bg-zinc-800/50 dark:bg-zinc-800/50 px-3 py-1 rounded-lg">
          Error ID: {error.digest}
        </p>
      )}

      {/* Dev-only stack trace */}
      {process.env.NODE_ENV !== 'production' && (
        <pre className="text-left text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 mb-6 max-w-lg overflow-auto max-h-40 w-full">
          {error.message}
        </pre>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          id="error-retry-btn"
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-zinc-700 text-sm font-semibold rounded-xl text-slate-700 dark:text-zinc-50 bg-white dark:bg-zinc-900/60 hover:bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 transition-colors"
        >
          <RefreshCcw size={14} aria-hidden="true" />
          Try again
        </button>
        <a
          id="error-home-btn"
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Home size={14} aria-hidden="true" />
          Back to Dashboard
        </a>
      </div>
    </div>
  );
});

export default ErrorBoundary;
