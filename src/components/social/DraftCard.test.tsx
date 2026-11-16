import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DraftCard } from "@/components/social/DraftCard";
import type { ReplyDraft } from "@/lib/social/types";
import { ruleWords } from "@/lib/social/words";
import { installFakeApi, json, type FakeApi } from "@/test/fake-api";

let api: FakeApi;
let changed: ReplyDraft[];

beforeEach(() => {
  changed = [];
});
afterEach(() => {
  cleanup();
  api?.restore();
});

function draft(overrides: Partial<ReplyDraft> = {}): ReplyDraft {
  return {
    id: "d1",
    accountId: "a1",
    platform: "facebook",
    category: "question",
    draftText: "Thanks for asking. We open at nine.",
    needsHumanReason: null,
    reviewRefusal: null,
    status: "pending",
    sentPlatformCommentId: null,
    failureCode: null,
    createdAt: "2026-11-16T12:00:00Z",
    decidedAt: null,
    sendingStartedAt: null,
    comment: {
      eventId: "e1",
      text: "When do you open?",
      authorDisplayName: "Sam",
      platformPostId: "p1",
      platformCommentId: "c1",
      occurredAt: "2026-11-16T11:59:00Z",
    },
    ...overrides,
  };
}

function show(current: ReplyDraft) {
  render(<DraftCard draft={current} accountLabel="Acme Page" onChanged={(next) => changed.push(next)} />);
}

const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

test("a pending draft shows the comment and the reply, and offers Approve, Edit and Reject", () => {
  api = installFakeApi({});
  show(draft());
  screen.getByText("When do you open?");
  screen.getByText("Thanks for asking. We open at nine.");
  for (const name of ["Approve and send", "Edit", "Reject"]) screen.getByRole("button", { name });
});

test("a draft with no reply text cannot be approved until a person writes one", () => {
  api = installFakeApi({});
  show(draft({ draftText: "   " }));
  assert.equal((screen.getByRole("button", { name: "Approve and send" }) as HTMLButtonElement).disabled, true);
});

test("typing in the edit box saves nothing, and cancelling discards it", () => {
  api = installFakeApi({});
  show(draft());
  click("Edit");
  fireEvent.change(screen.getByLabelText("Reply text"), { target: { value: "Something else" } });
  screen.getByText(/Not saved until you press Save/);
  assert.equal(api.calls.length, 0, "no request was made by typing");
  click("Cancel edit");
  screen.getByText("Thanks for asking. We open at nine.");
  assert.equal(api.calls.length, 0);
  assert.equal(changed.length, 0);
});

test("Save sends the text and uses the draft GeekAPI returns, without reading it again", async () => {
  const saved = draft({ draftText: "We open at nine, Monday to Friday." });
  api = installFakeApi({ "PUT /drafts/d1": json(saved) });
  show(draft());
  click("Edit");
  fireEvent.change(screen.getByLabelText("Reply text"), { target: { value: saved.draftText } });
  click("Save");
  await waitFor(() => assert.equal(changed.length, 1));
  assert.deepEqual(changed[0], saved);
  assert.deepEqual(api.to("PUT", "/drafts/d1")[0].body, { draftText: saved.draftText });
  assert.equal(api.to("GET", "/drafts/d1").length, 0, "the returned draft is used, not read again");
});

test("a Save the Reviewer refuses keeps the edit open, names the rules, and saves nothing", async () => {
  api = installFakeApi({
    "PUT /drafts/d1": json({ error: "The Reviewer refused this text.", code: "review_refused", violations: ["promises_refund"] }, 422),
  });
  show(draft());
  click("Edit");
  fireEvent.change(screen.getByLabelText("Reply text"), { target: { value: "Full refund, guaranteed." } });
  click("Save");
  await screen.findByText(/Nothing was saved/);
  screen.getByText(ruleWords("promises_refund"));
  screen.getByLabelText("Reply text");
  assert.equal(changed.length, 0);
});

test("Approve that sends shows Sent and hands up the returned draft with no re-read", async () => {
  const sent = draft({ status: "sent", sentPlatformCommentId: "r9" });
  api = installFakeApi({ "POST /drafts/d1/approve": json({ draft: sent, send: { sent: true, held: false } }) });
  show(draft());
  click("Approve and send");
  await screen.findByText("Sent.");
  assert.deepEqual(changed, [sent]);
  assert.equal(api.to("GET", "/drafts/d1").length, 0);
});

test("Approve that a send limit holds back says so, with the limit's reason", async () => {
  const held = draft({ status: "approved" });
  api = installFakeApi({
    "POST /drafts/d1/approve": json({
      draft: held,
      send: { sent: false, held: true, code: "send_limit_reached", error: null, retryAfter: null },
    }),
  });
  show(draft());
  click("Approve and send");
  await screen.findByText(/Approved and held back by a send limit/);
  assert.deepEqual(changed, [held]);
});

test("an Approve that GeekAPI definitely refused names the rules and does not re-read the draft", async () => {
  api = installFakeApi({
    "POST /drafts/d1/approve": json({ error: "The Reviewer refused this draft.", code: "review_refused", violations: ["promises_refund"] }, 422),
  });
  show(draft());
  click("Approve and send");
  await screen.findByText(/Nothing was sent/);
  screen.getByText(ruleWords("promises_refund"));
  assert.equal(api.to("GET", "/drafts/d1").length, 0, "a coded refusal is definite: nothing happened, so nothing to read back");
  assert.equal(changed.length, 0);
});

test("an Approve whose answer was lost shows the error, then reads the draft the server holds", async () => {
  const actuallySent = draft({ status: "sent", sentPlatformCommentId: "r9" });
  api = installFakeApi({
    "POST /drafts/d1/approve": new Response("Gateway Timeout", { status: 504 }),
    "GET /drafts/d1": json(actuallySent),
  });
  show(draft());
  click("Approve and send");
  await waitFor(() => assert.equal(changed.length, 1));
  assert.deepEqual(changed[0], actuallySent, "the card now shows the sent draft, not one that still looks pending");
  screen.getByText(/504/);
});

test("an Approve answered with something unreadable names what is missing and reads the draft", async () => {
  api = installFakeApi({
    "POST /drafts/d1/approve": json({}),
    "GET /drafts/d1": json(draft({ status: "sent" })),
  });
  show(draft());
  click("Approve and send");
  await screen.findByText(/without a send outcome, so the result is not known/);
  await waitFor(() => assert.equal(changed.length, 1));
  assert.equal(api.to("GET", "/drafts/d1").length, 1);
});

test("an Approve whose re-read also fails says the reply may be out and the re-read failed", async () => {
  api = installFakeApi({
    "POST /drafts/d1/approve": new Response("Gateway Timeout", { status: 504 }),
    "GET /drafts/d1": new Response("Service Unavailable", { status: 503 }),
  });
  show(draft());
  click("Approve and send");
  await screen.findByText(/but reading the draft back failed/);
  assert.equal(changed.length, 0);
});

test("a send GeekAPI could not confirm is shown as not confirmed, never as Not sent", async () => {
  api = installFakeApi({
    "POST /drafts/d1/approve": json({
      draft: draft({ status: "sending" }),
      send: { sent: false, held: false, code: "outcome_unknown", error: "The platform did not answer." },
    }),
  });
  show(draft());
  click("Approve and send");
  await screen.findByText(/Send not confirmed/);
  screen.getByText(/It is never sent again from here/);
  assert.equal(screen.queryByText("Not sent."), null);
});

test("an Approve that was definitely not sent says Not sent, with the code's words", async () => {
  api = installFakeApi({
    "POST /drafts/d1/approve": json({
      draft: draft({ status: "failed", failureCode: "token_expired" }),
      send: { sent: false, held: false, code: "token_expired", error: null },
    }),
  });
  show(draft());
  click("Approve and send");
  await screen.findByText("Not sent.");
});

test("a held draft's Send posts it, then reads the draft", async () => {
  const sent = draft({ status: "sent" });
  api = installFakeApi({
    "POST /drafts/d1/send": json({ draft: sent, send: { sent: true, held: false } }),
    "GET /drafts/d1": json(sent),
  });
  show(draft({ status: "approved" }));
  click("Send");
  await screen.findByText("Sent.");
  await waitFor(() => assert.equal(changed.length, 1));
  assert.equal(api.to("POST", "/drafts/d1/send").length, 1);
});

test("Reject asks first, and nothing is sent until it is confirmed", async () => {
  const rejected = draft({ status: "rejected" });
  api = installFakeApi({ "POST /drafts/d1/reject": json(rejected) });
  show(draft());
  click("Reject");
  assert.equal(api.calls.length, 0);
  click("Keep it");
  screen.getByRole("button", { name: "Reject" });
  assert.equal(api.calls.length, 0);
  click("Reject");
  click("Reject for good?");
  await waitFor(() => assert.equal(changed.length, 1));
  assert.deepEqual(changed[0], rejected);
  assert.equal(api.to("GET", "/drafts/d1").length, 0, "the returned draft is used");
});

test("a failed Reject keeps the draft as it was and shows the error", async () => {
  api = installFakeApi({ "POST /drafts/d1/reject": json({ error: "The draft changed.", code: "conflict" }, 409) });
  show(draft());
  click("Reject");
  click("Reject for good?");
  await screen.findByText(/The draft changed/);
  assert.equal(changed.length, 0);
});
