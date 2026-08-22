'use client';

import { useEffect, memo } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

/**
 * global-error.tsx — catches crashes in the root layout itself.
 * Must render its own <html> and <body>.
 */
const GlobalError = memo(function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Best-effort — report even if fetch fails
    fetch('/api/logs/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `[GLOBAL] ${error.message}`,
        digest: error.digest,
        url: typeof window !== 'undefined' ? window.location.href : 'root',
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});

    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f9fafb' }}>
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#fff',
              borderRadius: 24,
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
              padding: '2.5rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <AlertTriangle size={32} color="#dc2626" aria-hidden="true" />
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111', margin: '0 0 0.75rem' }}>
              Critical Error
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              A critical error occurred. Our team has been notified automatically.
            </p>

            {error.digest && (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  fontFamily: 'monospace',
                  background: '#f3f4f6',
                  borderRadius: 8,
                  padding: '0.4rem 0.75rem',
                  display: 'inline-block',
                  marginBottom: '2rem',
                }}
              >
                Ref: {error.digest}
              </p>
            )}

            {process.env.NODE_ENV !== 'production' && (
              <pre
                style={{
                  textAlign: 'left',
                  fontSize: '0.7rem',
                  color: '#dc2626',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 12,
                  padding: '1rem',
                  marginBottom: '2rem',
                  overflowX: 'auto',
                  maxHeight: 160,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {error.message}
              </pre>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                id="global-error-retry-btn"
                onClick={reset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.65rem 1.25rem',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 12,
                  background: '#fff',
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <RefreshCcw size={14} aria-hidden="true" />
                Try Again
              </button>

              <button
                id="global-error-home-btn"
                onClick={() => (window.location.href = '/dashboard')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.65rem 1.25rem',
                  borderRadius: 12,
                  background: '#2563eb',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <Home size={14} aria-hidden="true" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
});

export default GlobalError;
