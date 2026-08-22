'use client';

/**
 * ClientErrorBoundary — Phase 12
 * A reusable React class-based error boundary for client components.
 * Catches errors in any child component tree and shows a fallback UI.
 *
 * Usage:
 *   <ClientErrorBoundary fallback={<p>Failed to load.</p>}>
 *     <HeavyClientComponent />
 *   </ClientErrorBoundary>
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Custom fallback to render on error. If not provided, default UI is shown. */
  fallback?: ReactNode;
  /** Optional label for logging context */
  label?: string;
  /** Called when error is caught */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ClientErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const label = this.props.label ?? 'ClientErrorBoundary';
    console.error(`[${label}]`, error, info.componentStack);

    // Report to server-side log endpoint (best-effort)
    fetch('/api/logs/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `[${label}] ${error.message}`,
        component: info.componentStack?.split('\n')[1]?.trim() ?? 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});

    this.props.onError?.(error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    // Render custom fallback if provided
    if (this.props.fallback) return this.props.fallback;

    // Default fallback UI
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center min-h-[200px]"
      >
        <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-orange-400" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-100 text-sm">Something went wrong</h3>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <p className="text-xs text-zinc-500 mt-1 font-mono">{this.state.error.message}</p>
          )}
        </div>
        <button
          onClick={this.handleReset}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors border border-zinc-700"
        >
          <RefreshCcw size={12} aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }
}

/**
 * withErrorBoundary HOC
 * Wraps any component in a ClientErrorBoundary.
 *
 * Usage:
 *   const SafeChart = withErrorBoundary(HeavyChart, 'Analytics Chart');
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  label?: string,
  fallback?: ReactNode
): React.ComponentType<P> {
  const Wrapped = (props: P) => (
    <ClientErrorBoundary label={label} fallback={fallback}>
      <WrappedComponent {...props} />
    </ClientErrorBoundary>
  );
  Wrapped.displayName = `withErrorBoundary(${label ?? WrappedComponent.displayName ?? WrappedComponent.name})`;
  return Wrapped;
}
