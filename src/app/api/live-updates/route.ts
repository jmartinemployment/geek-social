import { NextRequest } from "next/server";
import { HUB_MESSAGES, formatEvent, formatRetry, RECONNECT_MS } from "@/lib/live-protocol";
import { errorText } from "@/lib/errors";
import { createHubBridge, retryDecision } from "@/lib/server/hub-bridge";
import { readSession } from "@/lib/session";

/**
 * Live updates for the browser, without a token in the browser. This route holds the SignalR connection
 * to GeekAPI on the server, with the person's access token from the encrypted session cookie, and
 * forwards each hub message down a Server-Sent Events stream. The browser opens an EventSource, which
 * sends its HttpOnly cookie and receives events; it holds no token.
 *
 * A stream cannot store a renewed refresh token (its response headers are already sent), so it runs on
 * the one access token it started with and ends on schedule before that token lapses. The browser
 * reopens it, and `proxy.ts` renews the sign-in ahead of the new request.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** The stream ends this long before the platform's limit, and before the access token lapses. */
const STREAM_SECONDS = 280;
const TOKEN_MARGIN_SECONDS = 15;
/** A stream needs a token good for at least this long, or it would end almost at once. */
const MIN_TOKEN_SECONDS = 60;

const HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-store, no-transform",
  connection: "keep-alive",
  "x-accel-buffering": "no",
} as const;

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) {
    return Response.json({ error: "Your sign-in has ended. Sign in again." }, { status: 401 });
  }
  const remaining = session.accessTokenExpiresAt - Math.floor(Date.now() / 1000);
  if (remaining < MIN_TOKEN_SECONDS) {
    return Response.json(
      { error: "The sign-in could not be renewed in time for live updates; GeekOAuth may be unreachable. Try again shortly." },
      { status: 502 },
    );
  }
  // The browser asks this after a stream is refused, because an EventSource cannot see why.
  if (request.headers.get("x-live-probe")) return Response.json({ ok: true });

  const accessToken = session.accessToken;
  const lifetimeMs = Math.min(STREAM_SECONDS, remaining - TOKEN_MARGIN_SECONDS) * 1000;
  const encoder = new TextEncoder();
  let finish: (last?: { event: string; data: unknown }) => Promise<void> = async () => {};
  // Set when the browser went away: the stream is already closed on its side, so closing it again would throw.
  let cancelled = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (!closed) controller.enqueue(encoder.encode(formatEvent(event, data)));
      };
      const hub = createHubBridge(() => accessToken, {
        onAttemptFailed: (reason) => send("reconnecting", { reason }),
        onGiveUp: (reason) => void finish({ event: "off", data: { reason } }),
      });

      finish = async (last) => {
        if (closed) return;
        if (last) send(last.event, last.data);
        closed = true;
        clearTimeout(deadline);
        if (!cancelled) controller.close();
        try {
          await hub.stop();
        } catch (err) {
          console.error("The live bridge's hub connection did not stop cleanly:", errorText(err));
        }
      };

      controller.enqueue(encoder.encode(formatRetry(RECONNECT_MS)));
      request.signal.addEventListener("abort", () => {
        cancelled = true;
        void finish();
      });
      // One-shot end of this stream, before the token it runs on lapses. Not a poll.
      const deadline = setTimeout(() => void finish({ event: "renew", data: {} }), lifetimeMs);

      for (const name of HUB_MESSAGES) hub.on(name, (body: unknown) => send(name, body));
      hub.onreconnecting((err) => send("reconnecting", { reason: err ? errorText(err) : null }));
      hub.onreconnected(() => send("live", {}));
      hub.onclose((err) => {
        // Reached after the retry policy gave up on something it can retry, or the hub closed cleanly.
        // The browser reopens the stream and the new one tries again.
        void finish({ event: "reconnecting", data: { reason: err ? errorText(err) : "The live connection closed." } });
      });

      try {
        await hub.start();
        send("live", {});
      } catch (err) {
        const decision = retryDecision(0, err instanceof Error ? err : new Error(errorText(err)));
        await finish(
          decision.kind === "stop"
            ? { event: "off", data: { reason: decision.reason } }
            : { event: "reconnecting", data: { reason: errorText(err) } },
        );
      }
    },
    cancel() {
      cancelled = true;
      void finish();
    },
  });

  return new Response(stream, { headers: HEADERS });
}
