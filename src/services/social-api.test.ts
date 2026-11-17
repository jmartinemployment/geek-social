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

test("plain text from a gateway in front of GeekAPI is shown as it came", () => {
  const err = refusalFrom(502, "Bad Gateway", "Could not reach GeekAPI: fetch failed");
  assert.equal(err.message, "GeekAPI answered 502: Could not reach GeekAPI: fetch failed");
});

// Draft actions and posts, against a stand-in for GeekAPI's routes.

import { draftApi, postApi, SocialApiError } from "@/services/social-api";
import { fakeApi, json } from "@/test/fake-api";

const DRAFT = { id: "d1", status: "sent" };
const SENT = { sent: true, held: false, code: null, error: null, retryAfter: null };

test("a send answered with { draft, send } gives the send outcome", async () => {
  const api = fakeApi({ "POST /drafts/d1/send": json({ draft: DRAFT, send: SENT }) });
  assert.deepEqual(await draftApi(api.transport).send("d1"), SENT);
});

test("a send answered without a send outcome is refused by name, not passed on as undefined", async () => {
  const api = fakeApi({ "POST /drafts/d1/send": json({ draft: DRAFT }) });
  await assert.rejects(draftApi(api.transport).send("d1"), (err: unknown) => {
    assert.ok(err instanceof SocialApiError);
    assert.equal(err.status, 200);
    assert.match(err.message, /without a send outcome/);
    return true;
  });
});

test("an approve answered without the draft or without a send outcome is refused by name", async () => {
  const lacksDraft = fakeApi({ "POST /drafts/d1/approve": json({ send: SENT }) });
  await assert.rejects(draftApi(lacksDraft.transport).approve("d1"), /without the draft/);
  const lacksOutcome = fakeApi({ "POST /drafts/d1/approve": json({ draft: DRAFT, send: { sent: "yes" } }) });
  await assert.rejects(draftApi(lacksOutcome.transport).approve("d1"), /without a send outcome/);
  const whole = fakeApi({ "POST /drafts/d1/approve": json({ draft: DRAFT, send: SENT }) });
  assert.deepEqual(await draftApi(whole.transport).approve("d1"), { draft: DRAFT, send: SENT });
});

test("posts are always listed for one account, because GeekAPI refuses the route without one", async () => {
  const api = fakeApi({ "GET /posts?accountId=acct-1&limit=200": json([]) });
  await postApi(api.transport).list("acct-1");
  assert.equal(api.calls.length, 1);
  assert.equal(api.calls[0].path, "/posts?accountId=acct-1&limit=200");
});
