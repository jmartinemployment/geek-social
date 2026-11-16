import { NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import { authFailurePage } from "@/lib/auth-failure";
import { oauthConfig } from "@/lib/env";
import { completeAuthorization } from "@/lib/oauth-client";
import { clearTransaction, readTransaction, writeSession } from "@/lib/session";

/**
 * GeekOAuth's redirect target. Checks the state against the sealed transaction cookie, exchanges the
 * code (PKCE verifier and client secret) on this server, verifies the ID token, and stores the session
 * in an encrypted cookie. No token is ever put in a URL, a response body or anything the browser's
 * JavaScript can read.
 */
export async function GET(request: NextRequest) {
  const transaction = await readTransaction(request.cookies);
  if (!transaction) {
    const response = authFailurePage(
      "Sign-in expired",
      "This browser has no sign-in in progress, or it expired. Start again.",
      400,
    );
    clearTransaction(response.cookies);
    return response;
  }

  // The registered callback address plus the query GeekOAuth sent, never a URL rebuilt from request headers.
  const callbackUrl = new URL(oauthConfig.redirectUri);
  callbackUrl.search = request.nextUrl.search;

  try {
    const session = await completeAuthorization(callbackUrl, transaction);
    const response = NextResponse.redirect(new URL(transaction.returnTo, oauthConfig.appOrigin), 303);
    await writeSession(response.cookies, request.cookies, session);
    clearTransaction(response.cookies);
    response.headers.set("cache-control", "no-store");
    return response;
  } catch (err) {
    // The code is single-use and the transaction is spent either way, so the next try starts fresh.
    const [title, detail, status] = describe(err);
    const response = authFailurePage(title, detail, status, transaction.flow === "register" ? "/api/auth/register" : "/api/auth/login");
    clearTransaction(response.cookies);
    return response;
  }
}

function describe(err: unknown): [string, string, number] {
  if (err instanceof client.AuthorizationResponseError) {
    const description = err.error_description ? ` (${err.error_description})` : "";
    return ["Sign-in was refused", `GeekOAuth answered ${err.error}${description}.`, 400];
  }
  if (err instanceof client.ResponseBodyError) {
    const description = err.error_description ? ` (${err.error_description})` : "";
    return ["Sign-in failed", `GeekOAuth refused the code exchange: ${err.error}${description}.`, 502];
  }
  return ["Sign-in failed", err instanceof Error ? err.message || err.name : String(err), 502];
}
