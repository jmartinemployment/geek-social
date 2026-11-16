import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { NextRequest } from "next/server";
import { clearedCookies, cookieHeaderFrom } from "@/test/cookies";
import { startMockIdp, useMockIdpEnvironment, type MockIdp } from "@/test/mock-idp";

/**
 * The real login, register, callback and logout routes against a stand-in GeekOAuth that enforces the
 * client secret, the PKCE verifier and single-use refresh tokens. The browser's hop through GeekOAuth's
 * own pages is played by the test.
 */

const APP = "http://localhost:3006";
let idp: MockIdp;

before(async () => {
  idp = await startMockIdp();
  useMockIdpEnvironment(idp);
});
after(() => idp.close());

async function routes() {
  return {
    login: await import("./login/route"),
    register: await import("./register/route"),
    callback: await import("./callback/route"),
    logout: await import("./logout/route"),
  };
}

function authorizeParams(location: URL): URLSearchParams {
  if (location.pathname === "/Account/Register") {
    const returnUrl = location.searchParams.get("returnUrl");
    assert.ok(returnUrl, "Register carries a returnUrl");
    return new URL(returnUrl, idp.issuer).searchParams;
  }
  return location.searchParams;
}

async function signIn(start: "login" | "register", returnTo: string) {
  const { login, register, callback } = await routes();
  const route = start === "login" ? login : register;
  const started = await route.GET(new NextRequest(`${APP}/api/auth/${start}?returnTo=${encodeURIComponent(returnTo)}`));
  assert.equal(started.status, 302);
  const params = authorizeParams(new URL(started.headers.get("location")!));
  idp.expect({ challenge: params.get("code_challenge")!, nonce: params.get("nonce")! });
  const answered = await callback.GET(
    new NextRequest(`${APP}/api/auth/callback?code=good-code&state=${params.get("state")}`, {
      headers: { cookie: cookieHeaderFrom(started) },
    }),
  );
  return { started, answered, params };
}

test("login redirects to the authorize endpoint with S256 PKCE, state and nonce, and seals the secrets in a cookie", async () => {
  const { login } = await routes();
  const res = await login.GET(new NextRequest(`${APP}/api/auth/login`));
  assert.equal(res.status, 302);
  const location = new URL(res.headers.get("location")!);
  assert.equal(location.origin + location.pathname, `${idp.issuer}/connect/authorize`);
  assert.equal(location.searchParams.get("response_type"), "code");
  assert.equal(location.searchParams.get("client_id"), "geek-social");
  assert.equal(location.searchParams.get("redirect_uri"), `${APP}/api/auth/callback`);
  assert.equal(location.searchParams.get("code_challenge_method"), "S256");
  assert.ok(location.searchParams.get("code_challenge"));
  assert.ok(location.searchParams.get("state"));
  assert.ok(location.searchParams.get("nonce"));
  assert.equal(location.searchParams.get("prompt"), "login");
  assert.match(location.searchParams.get("scope") ?? "", /geeksocial\.manage/);

  const cookie = res.headers.getSetCookie().find((line) => line.startsWith("gs_oauth_tx="));
  assert.ok(cookie, "a transaction cookie is set");
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=lax/i);
  assert.match(cookie, /Max-Age=600/i);
  // An encrypted compact JWE: five dot-separated parts, never the verifier in the clear.
  assert.equal(cookie.split(";")[0].split("=")[1].split(".").length, 5);
});

test("register sends the person to /Account/Register with the whole authorize request as a local returnUrl", async () => {
  const { register } = await routes();
  const res = await register.GET(new NextRequest(`${APP}/api/auth/register`));
  assert.equal(res.status, 302);
  const location = new URL(res.headers.get("location")!);
  assert.equal(location.origin + location.pathname, `${idp.issuer}/Account/Register`);

  const returnUrl = location.searchParams.get("returnUrl")!;
  assert.ok(returnUrl.startsWith("/connect/authorize?"), "a local path, not an absolute address");
  const inner = new URL(returnUrl, idp.issuer).searchParams;
  assert.equal(inner.get("code_challenge_method"), "S256");
  assert.ok(inner.get("code_challenge"));
  assert.ok(inner.get("state"));
  assert.ok(inner.get("nonce"));
  assert.equal(inner.get("redirect_uri"), `${APP}/api/auth/callback`);
  assert.equal(inner.get("prompt"), null, "no forced re-login after the person has just signed up");

  const cookie = res.headers.getSetCookie().find((line) => line.startsWith("gs_oauth_tx="));
  assert.match(cookie ?? "", /Max-Age=3600/i, "long enough to confirm an email");
});

test("a login completes: code exchange, session in encrypted cookies, redirect to the return path", async () => {
  const { started, answered } = await signIn("login", "/posts?tab=held");
  assert.equal(answered.status, 303);
  assert.equal(answered.headers.get("location"), `${APP}/posts?tab=held`);

  const lines = answered.headers.getSetCookie();
  assert.ok(lines.some((line) => line.startsWith("gs_session.0=") && /HttpOnly/i.test(line) && /SameSite=lax/i.test(line)));
  assert.ok(clearedCookies(answered).includes("gs_oauth_tx"), "the spent transaction is cleared");

  const everything = [answered.headers.get("location"), ...lines].join("\n");
  for (const secret of ["access-1", "refresh-1"]) {
    assert.ok(!everything.includes(secret), `${secret} appears in no URL or cookie value in the clear`);
  }

  const { readSession } = await import("@/lib/session");
  const jar = new Map(cookieHeaderFrom(answered).split("; ").map((pair) => [pair.split("=")[0], pair.split("=")[1]]));
  const session = await readSession({ get: (name) => (jar.has(name) ? { value: jar.get(name)! } : undefined) });
  assert.ok(session);
  assert.equal(session.accessToken, "access-1");
  assert.equal(session.refreshToken, "refresh-1");
  assert.equal(session.user.sub, "user-1");
  assert.deepEqual(session.user.roles, ["operator", "admin"]);
  assert.ok(started.headers.getSetCookie().length > 0);
});

test("a sign-up completes through the same callback, with the PKCE challenge it started with", async () => {
  const { answered } = await signIn("register", "/accounts");
  assert.equal(answered.status, 303);
  assert.equal(answered.headers.get("location"), `${APP}/accounts`);
  assert.ok(answered.headers.getSetCookie().some((line) => line.startsWith("gs_session.0=")));
});

test("a return path outside this app becomes /", async () => {
  const { answered } = await signIn("login", "https://evil.example/steal");
  assert.equal(answered.headers.get("location"), `${APP}/`);
});

test("a callback whose state is not the one this browser started is refused, and says so", async () => {
  const { login, callback } = await routes();
  const started = await login.GET(new NextRequest(`${APP}/api/auth/login`));
  const params = new URL(started.headers.get("location")!).searchParams;
  idp.expect({ challenge: params.get("code_challenge")!, nonce: params.get("nonce")! });
  const res = await callback.GET(
    new NextRequest(`${APP}/api/auth/callback?code=good-code&state=someone-elses-state`, {
      headers: { cookie: cookieHeaderFrom(started) },
    }),
  );
  assert.ok(res.status >= 400);
  assert.match(await res.text(), /Sign-in failed/);
  assert.ok(!res.headers.getSetCookie().some((line) => line.startsWith("gs_session")), "no session is created");
  assert.ok(clearedCookies(res).includes("gs_oauth_tx"));
});

test("a callback with no sign-in in progress says it expired", async () => {
  const { callback } = await routes();
  const res = await callback.GET(new NextRequest(`${APP}/api/auth/callback?code=good-code&state=x`));
  assert.equal(res.status, 400);
  assert.match(await res.text(), /Sign-in expired/);
});

test("GeekOAuth refusing the sign-in is shown with its own error", async () => {
  const { login, callback } = await routes();
  const started = await login.GET(new NextRequest(`${APP}/api/auth/login`));
  const state = new URL(started.headers.get("location")!).searchParams.get("state");
  const res = await callback.GET(
    new NextRequest(`${APP}/api/auth/callback?error=access_denied&error_description=No&state=${state}`, {
      headers: { cookie: cookieHeaderFrom(started) },
    }),
  );
  assert.equal(res.status, 400);
  const html = await res.text();
  assert.match(html, /Sign-in was refused/);
  assert.match(html, /access_denied/);
});

test("an ID token signed by a key GeekOAuth does not publish is refused", async () => {
  const { login, callback } = await routes();
  const started = await login.GET(new NextRequest(`${APP}/api/auth/login`));
  const params = new URL(started.headers.get("location")!).searchParams;
  idp.expect({ challenge: params.get("code_challenge")!, nonce: params.get("nonce")! });
  idp.signWithUnknownKey();
  try {
    const res = await callback.GET(
      new NextRequest(`${APP}/api/auth/callback?code=good-code&state=${params.get("state")}`, {
        headers: { cookie: cookieHeaderFrom(started) },
      }),
    );
    assert.ok(res.status >= 400);
    assert.ok(!res.headers.getSetCookie().some((line) => line.startsWith("gs_session")));
  } finally {
    idp.signWithUnknownKey(false);
  }
});

async function refusedWith(setup: (params: URLSearchParams) => void | (() => void)) {
  const { login, callback } = await routes();
  const started = await login.GET(new NextRequest(`${APP}/api/auth/login`));
  const params = new URL(started.headers.get("location")!).searchParams;
  const undo = setup(params);
  try {
    return await callback.GET(
      new NextRequest(`${APP}/api/auth/callback?code=good-code&state=${params.get("state")}`, {
        headers: { cookie: cookieHeaderFrom(started) },
      }),
    );
  } finally {
    if (undo) undo();
  }
}

test("an ID token carrying another nonce is refused", async () => {
  const res = await refusedWith((params) => idp.expect({ challenge: params.get("code_challenge")!, nonce: "a-different-nonce" }));
  assert.ok(res.status >= 400);
  assert.ok(!res.headers.getSetCookie().some((line) => line.startsWith("gs_session")));
});

test("an ID token for another audience is refused", async () => {
  const res = await refusedWith((params) => {
    idp.expect({ challenge: params.get("code_challenge")!, nonce: params.get("nonce")! });
    idp.useAudience("some-other-client");
    return () => idp.useAudience("geek-social");
  });
  assert.ok(res.status >= 400);
  assert.ok(!res.headers.getSetCookie().some((line) => line.startsWith("gs_session")));
});

test("a code exchange whose PKCE verifier does not match the challenge is refused by the token endpoint", async () => {
  const res = await refusedWith(() => idp.expect({ challenge: "not-this-browsers-challenge", nonce: "n" }));
  assert.equal(res.status, 502);
  assert.match(await res.text(), /invalid_grant/);
});

test("logout clears the session and ends GeekOAuth's with the ID token as the hint", async () => {
  const { logout } = await routes();
  const { answered } = await signIn("login", "/");
  const res = await logout.POST(
    new NextRequest(`${APP}/api/auth/logout`, {
      method: "POST",
      headers: { origin: APP, cookie: cookieHeaderFrom(answered) },
    }),
  );
  assert.equal(res.status, 200, "a fetch gets the address to go to, not a redirect it would follow");
  const location = new URL(((await res.json()) as { redirectTo: string }).redirectTo);
  assert.equal(location.origin + location.pathname, `${idp.issuer}/connect/logout`);
  assert.ok(location.searchParams.get("id_token_hint"));
  assert.equal(location.searchParams.get("post_logout_redirect_uri"), `${APP}/signed-out`);
  assert.ok(clearedCookies(res).includes("gs_session.0"));
});

test("logout from another origin is refused", async () => {
  const { logout } = await routes();
  const res = await logout.POST(
    new NextRequest(`${APP}/api/auth/logout`, { method: "POST", headers: { origin: "https://evil.example" } }),
  );
  assert.equal(res.status, 403);
});

test("logout with no session goes to the signed-out page", async () => {
  const { logout } = await routes();
  const res = await logout.POST(new NextRequest(`${APP}/api/auth/logout`, { method: "POST", headers: { origin: APP } }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { redirectTo: `${APP}/signed-out` });
});
