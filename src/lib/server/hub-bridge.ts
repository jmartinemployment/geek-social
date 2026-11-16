import { HttpTransportType, HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { apiConfig } from "@/lib/config";
import { errorText } from "@/lib/errors";

/**
 * The server's own SignalR connection to GeekAPI's /hubs/social-realtime, opened with the signed-in
 * person's access token so the token never reaches the browser. Long polling is used: it sends the
 * token in an Authorization header, where WebSockets would put it in the URL.
 */

/**
 * A sign-in the hub can never use: the session has ended (401) or does not carry the permission (403).
 * Retrying cannot fix it, so the connection stops and says why.
 */
export class HubSignInError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HubSignInError";
    this.status = status;
  }
}

const RECONNECT_DELAYS_MS = [0, 1000, 3000, 5000, 10000];
const RECONNECT_CAP_MS = 30000;

export type RetryDecision =
  | { kind: "retry"; delayMs: number }
  | { kind: "stop"; reason: string };

/**
 * Whether a failed connection attempt is worth another try.
 *
 * A short outage (a GeekAPI redeploy, a network blip) is retried without limit, because a connection
 * that gives up leaves the operator with no new drafts until they notice the banner. A refusal that
 * retrying cannot change (the session has ended, or the sign-in lacks the permission) stops, with the
 * reason, so the banner can say so and offer sign-in instead of "reconnecting" forever.
 */
export function retryDecision(previousRetryCount: number, reason: Error | undefined): RetryDecision {
  if (reason instanceof HubSignInError) return { kind: "stop", reason: reason.message };
  const statusCode = httpStatusOf(reason);
  if (statusCode === 401) {
    return { kind: "stop", reason: "GeekAPI refused the live connection's sign-in (401). Sign in again." };
  }
  if (statusCode === 403) {
    return {
      kind: "stop",
      reason: "Your sign-in does not carry the geeksocial.manage permission (403). Sign out and back in; if this stays, the account needs that scope granted in GeekOAuth.",
    };
  }
  return { kind: "retry", delayMs: RECONNECT_DELAYS_MS[previousRetryCount] ?? RECONNECT_CAP_MS };
}

/**
 * The HTTP status behind a failed connection attempt. SignalR's own HttpError carries it as
 * `statusCode`, but a failed negotiation is rethrown as a plain Error whose message ends
 * "Unauthorized: Status code '401'", so the status is read from there too. Without that, a refused
 * sign-in on the first connect would be taken for an outage and retried forever.
 */
export function httpStatusOf(reason: Error | undefined): number | undefined {
  if (!reason) return undefined;
  const statusCode = (reason as { statusCode?: unknown }).statusCode;
  if (typeof statusCode === "number") return statusCode;
  const match = /Status code '(\d{3})'/.exec(reason.message);
  return match ? Number(match[1]) : undefined;
}

export interface BridgeHandlers {
  /** An attempt failed and another is coming; `reason` is why this one failed. */
  onAttemptFailed: (reason: string) => void;
  /** The connection will not try again; `reason` is why. */
  onGiveUp: (reason: string) => void;
}

export function createHubBridge(accessToken: () => string, handlers: BridgeHandlers): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(apiConfig.socialHubUrl, {
      transport: HttpTransportType.LongPolling,
      accessTokenFactory: accessToken,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (context) => {
        const decision = retryDecision(context.previousRetryCount, context.retryReason);
        if (decision.kind === "stop") {
          handlers.onGiveUp(decision.reason);
          return null;
        }
        handlers.onAttemptFailed(errorText(context.retryReason));
        return decision.delayMs;
      },
    })
    .configureLogging(LogLevel.Warning)
    .build();
}
