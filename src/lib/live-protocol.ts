/**
 * What passes between the server's live bridge (`/api/live-updates`) and the browser's stream. The
 * server holds the SignalR connection to GeekAPI with the person's token; the browser only opens an
 * EventSource, which carries its HttpOnly session cookie and no token.
 */

export const LIVE_STREAM_PATH = "/api/live-updates";

/** The hub's messages, forwarded unchanged. Each carries ids and states only. */
export const HUB_MESSAGES = ["draftChanged", "commentChanged", "accountChanged"] as const;
export type HubMessageName = (typeof HUB_MESSAGES)[number];

/**
 * Stream events other than the hub's messages:
 * - live: the server's hub connection is up (sent on the first connect and after every reconnect)
 * - reconnecting: the hub dropped and the server is retrying; data is {reason}
 * - off: a refusal that retrying cannot change; data is {reason}, and the browser stops reconnecting
 * - renew: the stream is ending on schedule so the next one starts with a renewed sign-in
 */
export const CONTROL_EVENTS = ["live", "reconnecting", "off", "renew"] as const;
export type ControlEventName = (typeof CONTROL_EVENTS)[number];

/** How long the browser waits before it reopens a stream that ended. */
export const RECONNECT_MS = 3000;

export function formatEvent(event: string, data: unknown): string {
  // JSON.stringify never emits a raw newline, so one data line is always enough.
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function formatRetry(milliseconds: number): string {
  return `retry: ${milliseconds}\n\n`;
}

/** The {reason} a control event carries, or null when its data is not that shape. */
export function readReason(data: string): string | null {
  try {
    const value: unknown = JSON.parse(data);
    if (typeof value === "object" && value !== null && "reason" in value && typeof value.reason === "string") {
      return value.reason;
    }
    return null;
  } catch {
    return null;
  }
}
