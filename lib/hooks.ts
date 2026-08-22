'use client';

/**
 * useLocalStorage — Phase 16 (Memory / Re-render Optimization)
 * A memoised hook that reads/writes to localStorage with SSR safety.
 * Prevents excessive re-renders by memoizing the setter.
 */

import { useState, useCallback, useEffect } from 'react';

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  // Initialise state from localStorage (SSR-safe)
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Memoised setter that also writes to localStorage
  const setValue: SetValue<T> = useCallback(
    (value) => {
      try {
        setStoredValue((prev) => {
          const next = value instanceof Function ? value(prev) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(next));
          }
          return next;
        });
      } catch {
        // localStorage unavailable (private mode, full storage, etc.)
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

/**
 * useMediaQuery — Phase 16
 * Detects a CSS media query for responsive logic in JS without re-renders.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * useDebouncedValue — Phase 16
 * Returns a debounced copy of a value to avoid excessive re-renders on rapid input.
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebouncedValue(search, 300);
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

/**
 * usePrevious — Phase 16
 * Returns the previous render's value of a variable.
 * Useful for comparing before/after in effects without triggering re-renders.
 */
export function usePrevious<T>(value: T): T | undefined {
  const [current, setCurrent] = useState<T>(value);
  const [previous, setPrevious] = useState<T | undefined>(undefined);

  if (value !== current) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
}
