import { NextResponse } from "next/server";
import { getAccessTokenWithRefresh } from "@/lib/auth/session";

/**
 * The access token for the GeekSocial SignalR hub. The browser cannot read the httpOnly cookie, and
 * SignalR's accessTokenFactory needs the token itself, so this hands it over (as Content Creator
 * does for its hub). Same-origin only; never logged.
 */
export async function GET() {
  let token: string | null;
  try {
    token = await getAccessTokenWithRefresh();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Could not refresh the sign-in with GeekOAuth: ${detail}` },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!token) {
    return NextResponse.json(
      { error: "Your sign-in has ended. Sign in again." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    { accessToken: token },
    { headers: { "Cache-Control": "no-store" } },
  );
}
