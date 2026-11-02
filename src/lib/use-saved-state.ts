'use client';

import { useEffect, useState } from 'react';

/**
 * State kept in this browser's local storage. Every saved value in the app goes through this
 * hook, so it is the one place to change when saving moves to user accounts.
 */
export function useSavedState<T>(key: string, fallback: T, valid: (value: unknown) => value is T) {
  const [state, setState] = useState(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (valid(parsed)) setState(parsed);
      }
    } catch {
      // Storage can be blocked or hold bad data. Starting fresh is fine either way.
    }
    setReady(true);
  }, [key, valid]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Saving is best-effort.
    }
  }, [key, ready, state]);

  return [state, setState, ready] as const;
}
