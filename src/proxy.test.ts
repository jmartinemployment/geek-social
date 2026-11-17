import assert from "node:assert/strict";
import { after, before, mock, test } from "node:test";
import { NextRequest } from "next/server";
import { clearedCookies } from "@/test/cookies";
import { startMockIdp, useMockIdpEnvironment, type MockIdp } from "@/test/mock-idp";

const APP = "http://localhost:3006";
let idp: MockIdp;

before(async () => {
  idp = await startMockIdp();
  useMockIdpEnvironment(idp);
});
after(() => idp.close());

/** A request carrying a session whose access token has `secondsLeft` seconds left and whose refresh token is `refreshToken`. */
async function requestWithSession(path: string, secondsLeft: number, refreshToken = "refresh-1") {
  const { sealSessionCookies } = await import("@/lib/session");
  const cookies = await sealSessionCookies({
    accessToken: "old-access",
    refreshToken,
    idToken: "old-id-token",
    accessTokenExpiresAt: Math.floor(Date.now() / 1000) + secondsLeft,
    user: { sub: "user-1", roles: [] },
  });
  const cookie = cookies.map(({ name, value }) => `${name}=${value}`).join("; ");
  return { request: new NextRequest(`${APP}${path}`, { headers: { cookie } }), cookie };
}

test("a page request with no session is sent to sign-in, remembering where it was going", async () => {
  const { proxy } = await import("./proxy");
  const res = await proxy(new NextRequest(`${APP}/posts?tab=held`));
  assert.equal(res.status, 307);
  assert.equal(res.headers.get("location"), `${APP}/api/auth/login?returnTo=${encodeURIComponent("/posts?tab=held")}`);
});

test("an API request with no session gets a 401 and its message, not a redirect", async () => {
  const { proxy } = await import("./proxy");
  const res = await proxy(new NextRequest(`${APP}/api/live-updates`));
  assert.equal(res.status, 401);
  assert.match(((await res.json()) as { error: string }).error, /sign-in has ended/);
});

test("a session with plenty of life left passes straight through", async () => {
  const { proxy } = await import("./proxy");
  const before = idp.grants.refresh_token;
  const { request } = await requestWithSession("/", 600);
  const res = await proxy(request);
  assert.equal(res.headers.get("x-middleware-next"), "1");
  assert.equal(res.headers.getSetCookie().length, 0);
  assert.equal(idp.grants.refresh_token, before);
});

test("a session about to lapse is renewed, stored in the response and handed to the same request", async () => {
  const { proxy } = await import("./proxy");
  const before = idp.grants.refresh_token;
  const { request, cookie } = await requestWithSession("/accounts", 10);
  const res = await proxy(request);
  assert.equal(idp.grants.refresh_token, before + 1);
  assert.ok(res.headers.getSetCookie().some((line) => line.startsWith("gs_session.0=")));
  const forwarded = res.headers.get("x-middleware-request-cookie");
  assert.ok(forwarded?.includes("gs_session.0="), "the render sees the renewed cookie");
  assert.notEqual(forwarded, cookie);
});

test("a refresh token GeekOAuth refuses ends the session: cookies cleared, then sign-in", async () => {
  const { proxy } = await import("./proxy");
  const page = await proxy((await requestWithSession("/comments", 10, "dead-token")).request);
  assert.equal(page.status, 307);
  assert.match(page.headers.get("location") ?? "", /\/api\/auth\/login\?returnTo=/);
  assert.ok(clearedCookies(page).includes("gs_session.0"));

  const api = await proxy((await requestWithSession("/api/live-updates", 10, "dead-token")).request);
  assert.equal(api.status, 401);
  assert.ok(clearedCookies(api).includes("gs_session.0"));
});

test("GeekOAuth being unreachable is not read as the session ending: the cookies are left alone and the failure is logged", async () => {
  const { proxy } = await import("./proxy");
  idp.failRefresh(503, "upstream down");
  const errors = mock.method(console, "error", () => {});
  try {
    const res = await proxy((await requestWithSession("/", 10)).request);
    assert.equal(res.headers.get("x-middleware-next"), "1");
    assert.equal(res.headers.getSetCookie().length, 0);
    assert.equal(errors.mock.callCount(), 1);
    assert.match(String(errors.mock.calls[0].arguments[0]), /Could not renew the sign-in with GeekOAuth/);
  } finally {
    errors.mock.restore();
    idp.failRefresh(null);
  }
});

test("the live stream needs more life left than a page does", async () => {
  const { proxy } = await import("./proxy");
  const page = await proxy((await requestWithSession("/posts", 200)).request);
  assert.equal(page.headers.getSetCookie().length, 0, "200 seconds is enough for a page");
  const live = await proxy((await requestWithSession("/api/live-updates", 200)).request);
  assert.ok(live.headers.getSetCookie().some((line) => line.startsWith("gs_session.0=")), "but not for a 280-second stream");
});

test("requests that arrive together share one refresh, so a rotated token is not spent twice", async () => {
  const { proxy } = await import("./proxy");
  idp.delayRefresh(60);
  try {
    const before = idp.grants.refresh_token;
    const { request: a } = await requestWithSession("/", 10, "refresh-shared");
    const { request: b } = await requestWithSession("/posts", 10, "refresh-shared");
    const [first, second] = await Promise.all([proxy(a), proxy(b)]);
    assert.equal(idp.grants.refresh_token, before + 1);
    assert.ok(first.headers.getSetCookie().some((line) => line.startsWith("gs_session.0=")));
    assert.ok(second.headers.getSetCookie().some((line) => line.startsWith("gs_session.0=")));
  } finally {
    idp.delayRefresh(0);
  }
});
