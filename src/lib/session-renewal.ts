import { isSessionEnded, refreshSession } from "@/lib/oauth-client";
import type { Session } from "@/lib/session";

/** GeekOAuth could not be asked, or answered something other than a verdict on the session. The session is untouched. */
export class SessionRenewalError extends Error {
  constructor(detail: string) {
    super(`Could not renew the sign-in with GeekOAuth: ${detail}`);
    this.name = "SessionRenewalError";
  }
}

export type Renewal =
  | { kind: "current"; session: Session }
  | { kind: "renewed"; session: Session }
  | { kind: "ended" };

/** Renew when the access token has less than this left, so a request never starts with a token about to lapse. */
export const DEFAULT_MIN_VALIDITY_SECONDS = 60;

// GeekOAuth rotates refresh tokens: of two refreshes with the same token, the second is refused. Requests
// that arrive together within one server process share a single refresh. Two server instances can still
// race, which shows up as an ended session, never as a wrong one.
const inflight = new Map<string, Promise<Session>>();

/**
 * The session with an access token valid for at least `minValiditySeconds`, renewing it when it is not.
 * `ended` means GeekOAuth refused the refresh token; the caller clears the session and sends the person
 * to sign in. Any other failure throws SessionRenewalError and leaves the session alone.
 */
export async function renewSession(session: Session, minValiditySeconds: number): Promise<Renewal> {
  const remaining = session.accessTokenExpiresAt - Math.floor(Date.now() / 1000);
  if (remaining >= minValiditySeconds) return { kind: "current", session };

  let pending = inflight.get(session.refreshToken);
  if (!pending) {
    pending = refreshSession(session).finally(() => inflight.delete(session.refreshToken));
    inflight.set(session.refreshToken, pending);
  }
  try {
    return { kind: "renewed", session: await pending };
  } catch (err) {
    if (isSessionEnded(err)) return { kind: "ended" };
    throw new SessionRenewalError(err instanceof Error ? err.message || err.name : String(err));
  }
}
