import { errorText } from "@/lib/errors";
import { HUB_MESSAGES, LIVE_STREAM_PATH, readReason, type HubMessageName } from "@/lib/live-protocol";

/**
 * The browser end of live updates: an EventSource on this app's own /api/live-updates, which sends the
 * HttpOnly session cookie and carries no token. It is the one place a raw EventSource is allowed (the
 * source-rules test names this file), because the server end holds the SignalR connection.
 */

export interface LiveStreamHandlers {
  /** The server's hub connection is up: on the first connect and after every reconnect. */
  onLive: () => void;
  onMessage: (name: HubMessageName, body: unknown) => void;
  /** The stream dropped, or the server's hub did, and a retry is coming. `reason` is null when none was given. */
  onReconnecting: (reason: string | null) => void;
  /** Nothing more will be tried: a refusal retrying cannot fix, or a stream that sent something unreadable. */
  onOff: (reason: string) => void;
}

/** Opens the stream. Returns the function that closes it. */
export function openLiveStream(handlers: LiveStreamHandlers): () => void {
  const source = new EventSource(LIVE_STREAM_PATH);
  // Set when the server says the stream is ending on schedule, so the reopening that follows is not
  // reported as a dropped connection.
  let renewing = false;
  let finished = false;

  const stop = () => {
    finished = true;
    source.close();
  };

  source.addEventListener("open", () => {
    renewing = false;
  });
  source.addEventListener("live", () => handlers.onLive());
  source.addEventListener("renew", () => {
    renewing = true;
  });
  source.addEventListener("reconnecting", (event) => {
    handlers.onReconnecting(readReason((event as MessageEvent<string>).data));
  });
  source.addEventListener("off", (event) => {
    const reason = readReason((event as MessageEvent<string>).data) ?? "The live connection was refused.";
    stop();
    handlers.onOff(reason);
  });
  for (const name of HUB_MESSAGES) {
    source.addEventListener(name, (event) => {
      const text = (event as MessageEvent<string>).data;
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        stop();
        handlers.onOff(`The live stream sent a ${name} message that could not be read, so live updates were stopped.`);
        return;
      }
      handlers.onMessage(name, body);
    });
  }
  source.addEventListener("error", () => {
    if (finished) return;
    if (source.readyState === EventSource.CLOSED) {
      // The server answered with a status, not a stream. EventSource cannot say which, so ask.
      stop();
      void explainRefusal().then(handlers.onOff);
      return;
    }
    // CONNECTING: the browser is already reopening the stream.
    if (!renewing) handlers.onReconnecting(null);
  });

  return stop;
}

async function explainRefusal(): Promise<string> {
  let res: Response;
  try {
    res = await fetch(LIVE_STREAM_PATH, { headers: { "x-live-probe": "1" }, cache: "no-store" });
  } catch (err) {
    return `The live stream could not reach this app's server: ${errorText(err)}`;
  }
  const text = await res.text();
  if (res.ok) return "The live stream closed unexpectedly. Reconnect to try again.";
  try {
    const body = JSON.parse(text) as { error?: string };
    if (body.error) return body.error;
  } catch {
    // Not JSON: the status is reported below.
  }
  return `The live stream was refused (${res.status}).`;
}
