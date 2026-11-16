import { NextRequest, NextResponse } from "next/server";
import { authFailurePage } from "@/lib/auth-failure";
import { startAuthorization } from "@/lib/oauth-client";
import { safeReturnTo } from "@/lib/safe-return";
import { writeTransaction } from "@/lib/session";

/**
 * Starts sign-up without ever handling a password here. The browser goes to GeekOAuth's /Account/Register
 * carrying the full /connect/authorize request as its returnUrl, so once the person has registered and
 * signed in at GeekOAuth, OpenIddict issues the code back to /api/auth/callback with this request's PKCE
 * challenge, state and nonce unchanged.
 */
export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  try {
    const { redirectTo, transaction } = await startAuthorization("register", returnTo);
    const response = NextResponse.redirect(redirectTo, 302);
    await writeTransaction(response.cookies, transaction);
    response.headers.set("cache-control", "no-store");
    return response;
  } catch (err) {
    return authFailurePage("Could not start sign-up", err, 502, "/api/auth/register");
  }
}
