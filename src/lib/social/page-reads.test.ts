import assert from "node:assert/strict";
import { test } from "node:test";
import { inboxTab } from "@/lib/social/inbox";
import { readInbox, readOrRefusal, resolveAccountFilter, resolveChosenAccount } from "@/lib/social/page-reads";
import type { ReplyDraft } from "@/lib/social/types";
import { LIST_LIMIT, SocialApiError, type Transport } from "@/services/social-api";
import { account, draft } from "@/test/fixtures";

const mine = [account({ id: "a1", displayName: "Acme Page" }), account({ id: "a2", displayName: "Second Page" })];

test("an account filter that names one of the person's accounts is used", () => {
  assert.deepEqual(resolveAccountFilter(mine, "a2"), { accountId: "a2", unknown: false });
});

test("no account filter shows every account and says nothing", () => {
  assert.deepEqual(resolveAccountFilter(mine, null), { accountId: null, unknown: false });
  assert.deepEqual(resolveAccountFilter(mine, ""), { accountId: null, unknown: false });
});

test("an account filter that is not the person's is not used, and the page is told to say so", () => {
  assert.deepEqual(resolveAccountFilter(mine, "someone-elses"), { accountId: null, unknown: true });
  assert.deepEqual(resolveAccountFilter([], "a1"), { accountId: null, unknown: true });
});

test("a one-account page shows the account the address names", () => {
  const result = resolveChosenAccount(mine, "a2");
  assert.equal(result.chosen?.id, "a2");
  assert.equal(result.unknown, false);
});

test("a one-account page with no address shows the first connected account", () => {
  const result = resolveChosenAccount(mine, null);
  assert.equal(result.chosen?.id, "a1");
  assert.equal(result.unknown, false);
});

test("a one-account page whose address names a stranger shows the first account and says so", () => {
  const result = resolveChosenAccount(mine, "someone-elses");
  assert.equal(result.chosen?.id, "a1");
  assert.equal(result.unknown, true);
});

test("a one-account page with no account connected has none to show", () => {
  assert.deepEqual(resolveChosenAccount([], null), { chosen: null, unknown: false });
});

/** A transport that answers each draft list by its status and remembers what was asked. */
function draftsByStatus(byStatus: Record<string, ReplyDraft[]>) {
  const asked: string[] = [];
  const call: Transport = async <T,>(method: "GET" | "POST" | "PUT", path: string) => {
    assert.equal(method, "GET");
    asked.push(path);
    const status = new URL(path, "http://x").searchParams.get("status") ?? "";
    return (byStatus[status] ?? []) as T;
  };
  return { call, asked };
}

test("the Inbox reads each status its tab spans, keeps what the tab matches, and lists newest first", async () => {
  const { call, asked } = draftsByStatus({
    approved: [draft({ id: "old", status: "approved", createdAt: "2026-11-10T00:00:00Z" })],
    sending: [draft({ id: "new", status: "sending", createdAt: "2026-11-12T00:00:00Z" })],
  });
  const result = await readInbox(call, inboxTab("approved"), null);
  assert.equal(asked.length, 2, "one read per status");
  assert.deepEqual(result.drafts.map((d) => d.id), ["new", "old"]);
  assert.equal(result.truncated, false);
});

test("two tabs that share a status split it by the tab's own test", async () => {
  const { call } = draftsByStatus({
    pending: [
      draft({ id: "drafted", needsHumanReason: null }),
      draft({ id: "for-a-person", needsHumanReason: "A refund request", draftText: "" }),
    ],
  });
  assert.deepEqual((await readInbox(call, inboxTab("pending"), null)).drafts.map((d) => d.id), ["drafted"]);
  assert.deepEqual((await readInbox(call, inboxTab("for_person"), null)).drafts.map((d) => d.id), ["for-a-person"]);
});

test("the Inbox passes the account filter to GeekAPI", async () => {
  const { call, asked } = draftsByStatus({});
  await readInbox(call, inboxTab("sent"), "a2");
  assert.equal(asked.length, 1);
  assert.equal(new URL(asked[0], "http://x").searchParams.get("accountId"), "a2");
});

test("a read that came back at GeekAPI's limit is marked truncated, even when the tab then drops some of it", async () => {
  const full = Array.from({ length: LIST_LIMIT }, (_, i) => draft({ id: `d${i}`, status: "rejected", reviewRefusal: null }));
  const { call } = draftsByStatus({ rejected: full });
  const result = await readInbox(call, inboxTab("refused"), null);
  assert.equal(result.drafts.length, 0, "none of them were refused by the Reviewer");
  assert.equal(result.truncated, true, "older refused drafts may exist that were not returned");
});

test("a failed Inbox read is not swallowed", async () => {
  const call: Transport = async () => {
    throw new SocialApiError("Could not reach GeekAPI: down", 0, null, []);
  };
  await assert.rejects(() => readInbox(call, inboxTab("sent"), null), /Could not reach GeekAPI: down/);
});

test("a panel read that succeeds hands back its value", async () => {
  assert.deepEqual(await readOrRefusal(async () => [1, 2]), { ok: true, value: [1, 2] });
});

test("GeekAPI's own refusal comes back as its message for the panel to show", async () => {
  const result = await readOrRefusal(async () => {
    throw new SocialApiError("The social routes need the geeksocial.manage scope.", 403, "forbidden", []);
  });
  assert.deepEqual(result, { ok: false, message: "The social routes need the geeksocial.manage scope." });
});

test("anything else is rethrown untouched, so a bug or a redirect to sign-in is not shown as a panel message", async () => {
  const redirect = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/api/auth/login" });
  await assert.rejects(() => readOrRefusal(async () => Promise.reject(redirect)), (err) => err === redirect);
  const bug = new TypeError("posts is not iterable");
  await assert.rejects(() => readOrRefusal(async () => Promise.reject(bug)), (err) => err === bug);
});
