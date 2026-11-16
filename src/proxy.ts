import { NextRequest, NextResponse } from "next/server";
import { clearSession, planSessionWrite, readSession, SESSION_COOKIE } from "@/lib/session";
import { DEFAULT_MIN_VALIDITY_SECONDS, renewSession } from "@/lib/session-renewal";

/**
 * Optimistic route protection, and renewal of the access token ahead of the render.
 *
 * Cookies cannot be written while a Server Component renders, and GeekOAuth rotates refresh tokens, so a
 * renewal whose replacement is not stored would leave the browser holding a revoked token. This runs
 * before rendering and can set response cookies, so renewal belongs here. It also hands the renewed
 * cookies to the same request, so the render sees them without a round trip.
 *
 * This is the first check, not the only one: `lib/dal.ts` verifies the session again where data is read.
 */

// The live stream runs for at most its maxDuration (300 s) on one access token, because a stream cannot
// store a renewed refresh token. So it starts only with a token good for longer than that.
const LIVE_STREAM_MIN_VALIDITY_SECONDS = 330;

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  const session = await readSession(request.cookies);
  if (!session) return signedOut(request, isApi, `${pathname}${search}`, false);

  const minValidity =
    pathname === "/api/live-updates" ? LIVE_STREAM_MIN_VALIDITY_SECONDS : DEFAULT_MIN_VALIDITY_SECONDS;
  let renewal;
  try {
    renewal = await renewSession(session, minValidity);
  } catch (err) {
    // GeekOAuth could not be asked. That is not proof the session is over, so the cookies stay. The
    // request goes on and the first call that needs the token reports the same failure to the person.
    console.error(err instanceof Error ? err.message : String(err));
    return NextResponse.next();
  }
  if (renewal.kind === "current") return NextResponse.next();
  if (renewal.kind === "ended") return signedOut(request, isApi, `${pathname}${search}`, true);

  const plan = await planSessionWrite(request.cookies, renewal.session);
  const forwarded = request.cookies.getAll().filter(({ name }) => !name.startsWith(`${SESSION_COOKIE}.`));
  const cookieHeader = [...forwarded.map(({ name, value }) => ({ name, value })), ...plan.set]
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  const headers = new Headers(request.headers);
  headers.set("cookie", cookieHeader);

  const response = NextResponse.next({ request: { headers } });
  for (const { name, value, options } of plan.set) response.cookies.set(name, value, options);
  for (const { name, options } of plan.remove) response.cookies.set(name, "", options);
  return response;
}

function signedOut(request: NextRequest, isApi: boolean, returnTo: string, clear: boolean): NextResponse {
  const response = isApi
    ? NextResponse.json({ error: "Your sign-in has ended. Sign in again." }, { status: 401 })
    : NextResponse.redirect(new URL(`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`, request.url));
  if (clear) clearSession(response.cookies, request.cookies);
  return response;
}

export const config = {
  // Only paths that need a session. Static assets, the auth routes and the signed-out page must not
  // trigger a renewal: /api/auth/callback in particular sets the session cookies itself.
  matcher: [
    "/",
    "/comments/:path*",
    "/accounts/:path*",
    "/posts/:path*",
    "/activity/:path*",
    "/connect/:path*",
    "/welcome/:path*",
    "/api/social/:path*",
    "/api/live-updates",
  ],
};
