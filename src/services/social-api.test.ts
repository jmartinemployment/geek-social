import assert from "node:assert/strict";
import { test } from "node:test";
import { refusalFrom } from "@/services/social-api";

test("a GeekAPI failure keeps its sentence and code", () => {
  const err = refusalFrom(409, "Conflict", JSON.stringify({ error: "The draft is no longer pending.", code: "conflict" }));
  assert.equal(err.message, "The draft is no longer pending.");
  assert.equal(err.code, "conflict");
  assert.equal(err.status, 409);
  assert.deepEqual(err.violations, []);
});

test("a Reviewer refusal carries its violations", () => {
  const err = refusalFrom(
    422,
    "Unprocessable Entity",
    JSON.stringify({ error: "The text breaks: em_dash, unapproved_link.", code: "review_refused", violations: ["em_dash", "unapproved_link"] }),
  );
  assert.equal(err.code, "review_refused");
  assert.deepEqual(err.violations, ["em_dash", "unapproved_link"]);
});

test("a bare 403 says the scope is missing", () => {
  const err = refusalFrom(403, "Forbidden", "");
  assert.match(err.message, /geeksocial\.manage/);
});

test("plain text from the proxy is shown as it came", () => {
  const err = refusalFrom(502, "Bad Gateway", "Could not reach GeekAPI: fetch failed");
  assert.equal(err.message, "GeekAPI answered 502: Could not reach GeekAPI: fetch failed");
});

// Draft actions and posts, against a stand-in for the same-origin proxy.

import { approveDraft, listPosts, sendDraft, SocialApiError } from "@/services/social-api";

const DRAFT = { id: "d1", status: "sent" };
const SENT = { sent: true, held: false, code: null, error: null, retryAfter: null };

async function answeringWith(body: unknown, run: (requested: string[]) => Promise<void>) {
  const original = globalThis.fetch;
  const requested: string[] = [];
  globalThis.fetch = (async (url: string | URL | Request) => {
    requested.push(String(url));
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    await run(requested);
  } finally {
    globalThis.fetch = original;
  }
}

test("a send answered with { draft, send } gives the send outcome", async () => {
  await answeringWith({ draft: DRAFT, send: SENT }, async () => {
    assert.deepEqual(await sendDraft("d1"), SENT);
  });
});

test("a send answered without a send outcome is refused by name, not passed on as undefined", async () => {
  await answeringWith({ draft: DRAFT }, async () => {
    await assert.rejects(sendDraft("d1"), (err: unknown) => {
      assert.ok(err instanceof SocialApiError);
      assert.equal(err.status, 200);
      assert.match(err.message, /without a send outcome/);
      return true;
    });
  });
});

test("an approve answered without the draft or without a send outcome is refused by name", async () => {
  await answeringWith({ send: SENT }, async () => {
    await assert.rejects(approveDraft("d1"), /without the draft/);
  });
  await answeringWith({ draft: DRAFT, send: { sent: "yes" } }, async () => {
    await assert.rejects(approveDraft("d1"), /without a send outcome/);
  });
  await answeringWith({ draft: DRAFT, send: SENT }, async () => {
    assert.deepEqual(await approveDraft("d1"), { draft: DRAFT, send: SENT });
  });
});

test("posts are always listed for one account, because GeekAPI refuses the route without one", async () => {
  await answeringWith([], async (requested) => {
    await listPosts("acct-1");
    assert.match(requested[0], /\/api\/social\/posts\?accountId=acct-1&limit=200$/);
  });
});
