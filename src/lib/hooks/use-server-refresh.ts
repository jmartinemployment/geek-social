"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useTransition } from "react";

/**
 * Makes the server read the page's data again and render it, folding a burst into one more read. A request that
 * arrives while a refresh is running is not sent then: one more refresh runs when that one finishes, so the page ends
 * up showing what the server holds after the last request, and a flurry of live messages is not a flurry of reads.
 */
export function useServerRefresh(): { refresh: () => void; refreshing: boolean } {
  const router = useRouter();
  const [refreshing, start] = useTransition();
  const running = useRef(false);
  const queued = useRef(false);

  useEffect(() => {
    running.current = refreshing;
    if (!refreshing && queued.current) {
      queued.current = false;
      start(() => router.refresh());
    }
  }, [refreshing, router]);

  const refresh = useCallback(() => {
    if (running.current) {
      queued.current = true;
      return;
    }
    start(() => router.refresh());
  }, [router]);

  return { refresh, refreshing };
}
