import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiUrl } from "@/lib/api-url";
import { clearSession, readSession, writeSession, type Session } from "@/lib/session";
import { DEFAULT_MIN_VALIDITY_SECONDS, renewSession } from "@/lib/session-renewal";

/** The person's sign-in is over (GeekOAuth refused the refresh token, or there was none). The cookies are cleared. */
export class SessionEndedError extends Error {
  constructor() {
    super("Your sign-in has ended. Sign in again.");
    this.name = "SessionEndedError";
  }
}

export interface FetchWithAuthOptions {
  /**
   * What to do when the sign-in is over. "redirect" (the default) clears the cookies and sends the
   * browser to /api/auth/login, which suits rendering a page or running a Server Action. "throw" clears
   * them and throws SessionEndedError, which suits a JSON route whose caller reads a 401.
   */
  onSessionEnded?: "redirect" | "throw";
  /** Renew when the access token has less than this left. */
  minValiditySeconds?: number;
}

/**
 * Calls GeekAPI as the signed-in person: the access token from the encrypted session cookie goes in the
 * Authorization header, renewed first when it is about to lapse, with the new tokens stored back in the
 * cookie (GeekOAuth rotates refresh tokens, so storing them is not optional). A 401 from GeekAPI renews
 * once and retries once; a second 401 is returned as it came.
 *
 * Only for Route Handlers and Server Actions, where cookies can be written. In a Server Component the
 * write throws, and `proxy.ts` has normally renewed the session before the page renders. The request
 * body must be one that can be sent twice (a string or buffer, not a stream). `target` is a path on
 * GeekAPI or an absolute address on its origin: the token is never sent anywhere else.
 */
export async function fetchWithAuth(
  target: string | URL,
  init: RequestInit = {},
  options: FetchWithAuthOptions = {},
): Promise<Response> {
  const url = apiUrl(target);
  const jar = await cookies();
  let session = await readSession(jar);
  if (!session) return endSession(jar, options);

  const first = await renewSession(session, options.minValiditySeconds ?? DEFAULT_MIN_VALIDITY_SECONDS);
  if (first.kind === "ended") return endSession(jar, options);
  if (first.kind === "renewed") {
    session = first.session;
    await writeSession(jar, jar, session);
  } else {
    session = first.session;
  }

  const response = await send(url, init, session);
  if (response.status !== 401) return response;

  // GeekAPI refused a token that looked valid (revoked, or the clocks disagree). Renew once and retry once.
  const second = await renewSession(session, Number.POSITIVE_INFINITY);
  if (second.kind === "ended") return endSession(jar, options);
  if (second.kind === "current") return response;
  await writeSession(jar, jar, second.session);
  return send(url, init, second.session);
}

function send(url: URL, init: RequestInit, session: Session): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.accessToken}`);
  return fetch(url, { ...init, headers, cache: "no-store" });
}

async function endSession(jar: Awaited<ReturnType<typeof cookies>>, options: FetchWithAuthOptions): Promise<never> {
  clearSession(jar, jar);
  if (options.onSessionEnded === "throw") throw new SessionEndedError();
  redirect("/api/auth/login");
}
