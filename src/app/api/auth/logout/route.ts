import { NextRequest, NextResponse } from "next/server";
import { oauthConfig } from "@/lib/env";
import { endSessionUrl } from "@/lib/oauth-client";
import { isSameOriginWrite } from "@/lib/same-origin";
import { clearSession, readSession } from "@/lib/session";

/**
 * RP-initiated logout, called with fetch from the navbar (never a form post, so the page is not
 * reloaded to sign out). It clears this app's session cookies and answers `{ redirectTo }`: GeekOAuth's
 * end_session_endpoint with the ID token as the hint, so the next sign-in asks for credentials, or the
 * signed-out page when there was no session. The browser then navigates there. POST only, and only
 * from this app's own origin, so another site cannot sign a person out.
 */
export async function POST(request: NextRequest) {
  if (!isSameOriginWrite(request, oauthConfig.appOrigin)) {
    return NextResponse.json({ error: "Sign-out must be requested from this app." }, { status: 403 });
  }

  const session = await readSession(request.cookies);
  const signedOut = new URL("/signed-out", oauthConfig.appOrigin).toString();
  if (!session) {
    const response = NextResponse.json({ redirectTo: signedOut });
    clearSession(response.cookies, request.cookies);
    return response;
  }

  try {
    const response = NextResponse.json({ redirectTo: (await endSessionUrl(session.idToken)).toString() });
    clearSession(response.cookies, request.cookies);
    return response;
  } catch (err) {
    // This app's cookies are cleared either way. Only GeekOAuth's own session could not be ended, and
    // the person is told that, because their next sign-in there will not ask for credentials.
    const response = NextResponse.json(
      {
        error: `Signed out of GeekSocial, but not of GeekOAuth: it could not be reached to end its session (${err instanceof Error ? err.message || err.name : String(err)}). Signing in again may not ask for a password until you sign out there.`,
        redirectTo: signedOut,
      },
      { status: 502 },
    );
    clearSession(response.cookies, request.cookies);
    return response;
  }
}
