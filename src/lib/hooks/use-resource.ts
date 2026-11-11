"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { errorText } from "@/services/social-api";

/**
 * Loads one thing for a key (a tab, an account filter) and reloads it on request.
 *
 * `loading` is true only until the first answer for this key arrives; a reload keeps the current
 * data on screen and sets `refreshing`. A failed load clears the data and carries the error, so a
 * failure is never shown as an empty list. Reloads asked for while one is in flight are folded into
 * one more load after it, so a burst of live messages costs two requests, not one per message.
 */
export function useResource<T>(key: string, load: () => Promise<T>) {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    nonce: number;
    data: T | null;
    error: string | null;
  } | null>(null);
  const runLoad = useEffectEvent(load);
  const inFlight = useRef(false);
  const again = useRef(false);

  useEffect(() => {
    let cancelled = false;
    inFlight.current = true;
    runLoad().then(
      (data) => {
        if (cancelled) return;
        setResult({ key, nonce, data, error: null });
      },
      (err: unknown) => {
        if (cancelled) return;
        setResult({ key, nonce, data: null, error: errorText(err) });
      },
    ).finally(() => {
      if (cancelled) return;
      inFlight.current = false;
      if (again.current) {
        again.current = false;
        setNonce((n) => n + 1);
      }
    });
    return () => {
      cancelled = true;
      inFlight.current = false;
    };
  }, [key, nonce]);

  const reload = useCallback(() => {
    if (inFlight.current) {
      again.current = true;
      return;
    }
    setNonce((n) => n + 1);
  }, []);

  const setData = useCallback((update: (current: T) => T) => {
    setResult((r) => (r && r.data !== null ? { ...r, data: update(r.data) } : r));
  }, []);

  const loading = result === null || result.key !== key;
  return {
    loading,
    refreshing: !loading && result.nonce !== nonce,
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    reload,
    setData,
  };
}
