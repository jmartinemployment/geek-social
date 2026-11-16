import "@/test/set-env";
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseEnvironment } from "@/lib/env";

const valid = {
  OAUTH_ISSUER_URL: "https://auth.geekatyourspot.com/",
  OAUTH_CLIENT_ID: "geek-social",
  OAUTH_CLIENT_SECRET: "0123456789abcdef0123",
  OAUTH_REDIRECT_URI: "https://geek-social.geekatyourspot.com/api/auth/callback",
  SESSION_SECRET: "0123456789abcdef0123456789abcdef",
};

function problemsOf(overrides: Record<string, string | undefined>): string {
  try {
    parseEnvironment({ ...valid, ...overrides });
  } catch (err) {
    return (err as Error).message;
  }
  assert.fail("expected the environment to be refused");
}

test("a complete environment is accepted, and the issuer loses its trailing slash", () => {
  assert.equal(parseEnvironment(valid).OAUTH_ISSUER_URL, "https://auth.geekatyourspot.com");
});

test("every missing variable is named in one error", () => {
  const message = problemsOf({
    OAUTH_ISSUER_URL: undefined,
    OAUTH_CLIENT_ID: undefined,
    OAUTH_CLIENT_SECRET: undefined,
    OAUTH_REDIRECT_URI: undefined,
    SESSION_SECRET: undefined,
  });
  for (const name of ["OAUTH_ISSUER_URL", "OAUTH_CLIENT_ID", "OAUTH_CLIENT_SECRET", "OAUTH_REDIRECT_URI", "SESSION_SECRET"]) {
    assert.ok(message.includes(name), `${name} is named`);
  }
});

test("an empty value is not a value", () => {
  assert.match(problemsOf({ OAUTH_CLIENT_ID: "   " }), /OAUTH_CLIENT_ID/);
  assert.match(problemsOf({ SESSION_SECRET: "" }), /SESSION_SECRET/);
});

test("weak secrets are refused, and their values are never printed", () => {
  const message = problemsOf({ SESSION_SECRET: "too-short-secret", OAUTH_CLIENT_SECRET: "short-one" });
  assert.match(message, /SESSION_SECRET: must be at least 32 characters/);
  assert.match(message, /OAUTH_CLIENT_SECRET: must be at least 16 characters/);
  assert.ok(!message.includes("too-short-secret") && !message.includes("short-one"));
});

test("plain http is refused except for a machine's own loopback", () => {
  assert.match(problemsOf({ OAUTH_ISSUER_URL: "http://auth.geekatyourspot.com" }), /OAUTH_ISSUER_URL: must be an https address/);
  assert.equal(parseEnvironment({ ...valid, OAUTH_ISSUER_URL: "http://localhost:5001" }).OAUTH_ISSUER_URL, "http://localhost:5001");
});

test("the callback must be /api/auth/callback with no query", () => {
  assert.match(problemsOf({ OAUTH_REDIRECT_URI: "https://geek-social.geekatyourspot.com/auth/callback" }), /OAUTH_REDIRECT_URI: must end with \/api\/auth\/callback/);
  assert.match(problemsOf({ OAUTH_REDIRECT_URI: "https://geek-social.geekatyourspot.com/api/auth/callback?x=1" }), /OAUTH_REDIRECT_URI/);
});
