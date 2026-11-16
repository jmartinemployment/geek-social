import { NextRequest, NextResponse } from "next/server";
import { authFailurePage } from "@/lib/auth-failure";
import { oauthConfig } from "@/lib/env";
import { endSessionUrl } from "@/lib/oauth-client";
import { clearSession, readSession } from "@/lib/session";

/**
 * RP-initiated logout: clears this app's session cookies, then sends the browser to GeekOAuth's
 * end_session_endpoint with the ID token as the hint, so the next sign-in asks for credentials. POST
 * only, and only from this app's own origin, so another site cannot sign a person out with a link.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin !== oauthConfig.appOrigin) {
    return NextResponse.json({ error: "Sign-out must be requested from this app." }, { status: 403 });
  }

  const session = await readSession(request.cookies);
  const signedOut = new URL("/signed-out", oauthConfig.appOrigin);
  if (!session) {
    const response = NextResponse.redirect(signedOut, 303);
    clearSession(response.cookies, request.cookies);
    return response;
  }

  try {
    const response = NextResponse.redirect(await endSessionUrl(session.idToken), 303);
    clearSession(response.cookies, request.cookies);
    return response;
  } catch (err) {
    // This app's cookies are cleared either way. Only GeekOAuth's own session could not be ended, and
    // the person is told that, because their next sign-in there will not ask for credentials.
    const response = authFailurePage(
      "Signed out of GeekSocial, but not of GeekOAuth",
      `GeekOAuth could not be reached to end its session (${err instanceof Error ? err.message || err.name : String(err)}). Signing in again may not ask for a password until you sign out there.`,
      502,
    );
    clearSession(response.cookies, request.cookies);
    return response;
  }
}
