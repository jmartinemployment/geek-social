import "@/test/set-env";
import assert from "node:assert/strict";
import { mock, test } from "node:test";
import {
  clearSession,
  planSessionWrite,
  readSession,
  readTransaction,
  sealSessionCookies,
  writeSession,
  writeTransaction,
  type CookieOptions,
  type Session,
  type Transaction,
} from "@/lib/session";

class Jar {
  readonly values = new Map<string, string>();
  readonly writes: { name: string; value: string; options: CookieOptions }[] = [];
  get(name: string) {
    const value = this.values.get(name);
    return value === undefined ? undefined : { value };
  }
  set(name: string, value: string, options: CookieOptions) {
    this.writes.push({ name, value, options });
    if (options.maxAge === 0) this.values.delete(name);
    else this.values.set(name, value);
  }
}

function session(overrides: Partial<Session> = {}): Session {
  return {
    accessToken: "a".repeat(900),
    refreshToken: "r".repeat(300),
    idToken: "i".repeat(900),
    accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 900,
    user: { sub: "user-1", name: "Ada", email: "ada@example.com", roles: ["operator"] },
    ...overrides,
  };
}

test("a session survives the round trip through its cookies, and the cookies hold no token in the clear", async () => {
  const jar = new Jar();
  await writeSession(jar, jar, session());
  const stored = [...jar.values.values()].join("");
  assert.ok(!stored.includes("aaaaaaaaaa") && !stored.includes("rrrrrrrrrr"));
  const read = await readSession(jar);
  assert.equal(read?.user.email, "ada@example.com");
  assert.equal(read?.accessToken, "a".repeat(900));
});

test("every session cookie is HttpOnly and SameSite=Lax, on the whole site", async () => {
  const jar = new Jar();
  await writeSession(jar, jar, session());
  assert.ok(jar.writes.length >= 1);
  for (const { options } of jar.writes) {
    assert.equal(options.httpOnly, true);
    assert.equal(options.sameSite, "lax");
    assert.equal(options.path, "/");
    assert.equal(options.maxAge, 60 * 60 * 24 * 14);
  }
});

test("a session too big for one cookie is split, each part within the browser's limit", async () => {
  const cookies = await sealSessionCookies(session({ accessToken: "a".repeat(2500) }));
  assert.ok(cookies.length > 1);
  for (const { value } of cookies) assert.ok(value.length <= 3500);
  const jar = new Jar();
  await writeSession(jar, jar, session({ accessToken: "a".repeat(2500) }));
  assert.equal((await readSession(jar))?.accessToken.length, 2500);
});

test("a session that would need more cookies than allowed is refused by name, not truncated", async () => {
  await assert.rejects(sealSessionCookies(session({ accessToken: "a".repeat(30000) })), /at most 6 are supported/);
});

test("storing a smaller session removes the cookies it no longer needs", async () => {
  const jar = new Jar();
  await writeSession(jar, jar, session({ accessToken: "a".repeat(2500) }));
  const before = jar.values.size;
  assert.ok(before > 1);
  await writeSession(jar, jar, session());
  assert.ok(jar.values.size < before);
  assert.equal((await readSession(jar))?.accessToken.length, 900);
});

test("a changed cookie is not a session, and the log says why", async () => {
  const jar = new Jar();
  await writeSession(jar, jar, session());
  const first = jar.values.get("gs_session.0")!;
  jar.values.set("gs_session.0", `${first.slice(0, -4)}AAAA`);
  const warn = mock.method(console, "warn", () => {});
  try {
    assert.equal(await readSession(jar), null);
    assert.equal(warn.mock.callCount(), 1);
  } finally {
    warn.mock.restore();
  }
});

test("a sign-in transaction cookie cannot be presented as a session", async () => {
  const jar = new Jar();
  const transaction: Transaction = { codeVerifier: "v", state: "s", nonce: "n", flow: "login", returnTo: "/" };
  await writeTransaction(jar, transaction);
  const stolen = new Jar();
  stolen.values.set("gs_session.0", jar.values.get("gs_oauth_tx")!);
  const warn = mock.method(console, "warn", () => {});
  try {
    assert.equal(await readSession(stolen), null);
  } finally {
    warn.mock.restore();
  }
});

test("a transaction round-trips, and a register transaction lives an hour against a login's ten minutes", async () => {
  const jar = new Jar();
  const base = { codeVerifier: "v", state: "s", nonce: "n", returnTo: "/posts" } as const;
  await writeTransaction(jar, { ...base, flow: "login" });
  assert.equal((await readTransaction(jar))?.returnTo, "/posts");
  assert.equal(jar.writes[0].options.maxAge, 600);
  await writeTransaction(jar, { ...base, flow: "register" });
  assert.equal(jar.writes[1].options.maxAge, 3600);
});

test("signing out clears every session cookie that is present", async () => {
  const jar = new Jar();
  await writeSession(jar, jar, session({ accessToken: "a".repeat(2500) }));
  clearSession(jar, jar);
  assert.equal(await readSession(jar), null);
  assert.equal(jar.values.size, 0);
  const plan = await planSessionWrite(jar, session());
  assert.equal(plan.remove.length, 0);
});
