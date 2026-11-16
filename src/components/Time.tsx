"use client";

import { useSyncExternalStore } from "react";
import { formatTime, formatTimeUtc } from "@/components/ui-helpers";

const subscribe = () => () => {};

/**
 * A time in the viewer's own time zone. The server does not know that zone, so the page it renders (and the first
 * pass in the browser, which must match it) says the time in UTC, named as UTC; once the browser has taken over it
 * says it in local time. Showing the server's zone as if it were the viewer's, or letting the two disagree, is wrong
 * either way.
 */
export function Time({ value }: { value: string | null | undefined }) {
  const text = useSyncExternalStore(
    subscribe,
    () => formatTime(value),
    () => formatTimeUtc(value),
  );
  return <time dateTime={value ?? undefined}>{text}</time>;
}
