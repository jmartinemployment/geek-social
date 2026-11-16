import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { apiConfig } from "@/lib/config";
import { errorText } from "@/lib/errors";

/**
 * A sign-in the live connection can never use: the session has ended (401) or does not carry the
 * permission (403). Retrying cannot fix it, so the connection stops and says why.
 */
export class HubSignInError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HubSignInError";
    this.status = status;
  }
}

/**
 * The access token for the hub, from this app's server (the browser cannot read the httpOnly
 * cookie). Content Creator gets its hub token the same way.
 */
async function hubAccessToken(): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/auth/hub-token", { cache: "no-store" });
  } catch (err) {
    throw new Error(`Could not reach this app's server for the live-update sign-in: ${errorText(err)}`);
  }
  const text = await res.text();
  let body: { accessToken?: string; error?: string } = {};
  try {
    body = text ? (JSON.parse(text) as typeof body) : {};
  } catch {
    throw new Error(`The live-update sign-in answered ${res.status} with a body that is not JSON.`);
  }
  if (!res.ok) {
    const message = body.error || `The live-update sign-in answered ${res.status}.`;
    if (res.status === 401 || res.status === 403) throw new HubSignInError(message, res.status);
    throw new Error(message);
  }
  if (!body.accessToken) throw new Error("The live-update sign-in answered with no token.");
  return body.accessToken;
}

export const HUB_MESSAGES = ["draftChanged", "commentChanged", "accountChanged"] as const;
export type HubMessageName = (typeof HUB_MESSAGES)[number];

const RECONNECT_DELAYS_MS = [0, 1000, 3000, 5000, 10000];
const RECONNECT_CAP_MS = 30000;

export type RetryDecision =
  | { kind: "retry"; delayMs: number }
  | { kind: "stop"; reason: string };

/**
 * Whether a failed connection attempt is worth another try.
 *
 * A short outage (a GeekAPI redeploy, a network blip) is retried without limit, because a
 * connection that gives up leaves the operator with no new drafts until they notice the banner. A
 * refusal that retrying cannot change (the session has ended, or the sign-in lacks the permission)
 * stops, with the reason, so the banner can say so and offer sign-in instead of "reconnecting"
 * forever.
 */
export function retryDecision(previousRetryCount: number, reason: Error | undefined): RetryDecision {
  if (reason instanceof HubSignInError) return { kind: "stop", reason: reason.message };
  const statusCode = (reason as { statusCode?: unknown } | undefined)?.statusCode;
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

export interface ReconnectHandlers {
  /** An attempt failed and another is coming; `reason` is why this one failed. */
  onAttemptFailed: (reason: string) => void;
  /** The connection will not try again; `reason` is why. */
  onGiveUp: (reason: string) => void;
}

export function createSocialHubConnection(handlers: ReconnectHandlers): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(apiConfig.socialHubUrl, { accessTokenFactory: hubAccessToken })
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
