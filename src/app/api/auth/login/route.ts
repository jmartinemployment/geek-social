import { NextRequest, NextResponse } from "next/server";
import { authFailurePage } from "@/lib/auth-failure";
import { startAuthorization } from "@/lib/oauth-client";
import { safeReturnTo } from "@/lib/safe-return";
import { writeTransaction } from "@/lib/session";

/** Starts sign-in: PKCE, state and nonce are generated here, sealed in a cookie, and GeekOAuth's authorize endpoint is the redirect. */
export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  try {
    const { redirectTo, transaction } = await startAuthorization("login", returnTo);
    const response = NextResponse.redirect(redirectTo, 302);
    await writeTransaction(response.cookies, transaction);
    response.headers.set("cache-control", "no-store");
    return response;
  } catch (err) {
    return authFailurePage("Could not start sign-in", err, 502);
  }
}
