'use client';

import React, { createContext, useContext, useCallback, type ReactNode } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: number;
  email: string;
  name: string | null;
  role: 'master' | 'admin' | 'user';
  workspace_id: number;
  plan?: string;
}

interface AppState {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
}

interface AppContextType extends AppState {
  /** Refetch the current user from the server */
  refreshUser: () => void;
  /** Invalidate all SWR caches (call after major mutations) */
  invalidateAll: () => void;
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url, { credentials: 'same-origin' }).then(res => {
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  });

// ─── Context ─────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    isLoading,
    error,
    mutate,
  } = useSWR<User>('/api/auth/me', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60_000,       // Only re-fetch user once per minute max
    errorRetryCount: 2,
    shouldRetryOnError: false,      // Don't retry auth errors
  });

  const refreshUser = useCallback(() => {
    mutate();
  }, [mutate]);

  const invalidateAll = useCallback(() => {
    globalMutate(() => true, undefined, { revalidate: true });
  }, []);

  return (
    <AppContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isError: !!error,
        refreshUser,
        invalidateAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}

/** Shortcut: access the current user */
export function useCurrentUser(): User | null {
  return useApp().user;
}

/** Shortcut: check if user is master/admin */
export function useIsMaster(): boolean {
  return useApp().user?.role === 'master';
}
