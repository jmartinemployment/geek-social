import assert from "node:assert/strict";
import { test } from "node:test";
import { INBOX_TABS, inboxTab, placeDraft } from "@/lib/social/inbox";
import type { ReplyDraft } from "@/lib/social/types";

function draft(overrides: Partial<ReplyDraft>): ReplyDraft {
  return {
    id: "d1",
    accountId: "a1",
    platform: "facebook",
    category: "question",
    draftText: "Thanks for asking.",
    needsHumanReason: null,
    reviewRefusal: null,
    status: "pending",
    sentPlatformCommentId: null,
    failureCode: null,
    createdAt: "2026-11-11T10:00:00Z",
    decidedAt: null,
    sendingStartedAt: null,
    comment: {
      eventId: "e1",
      text: null,
      authorDisplayName: null,
      platformPostId: "p1",
      platformCommentId: "c1",
      occurredAt: "2026-11-11T09:59:00Z",
    },
    ...overrides,
  };
}

function tabsOf(d: ReplyDraft): string[] {
  return INBOX_TABS.filter((t) => t.matches(d)).map((t) => t.id);
}

test("every draft lands in exactly one tab", () => {
  const cases: [Partial<ReplyDraft>, string][] = [
    [{ status: "pending" }, "pending"],
    [{ status: "pending", needsHumanReason: "A refund request", draftText: "" }, "for_person"],
    [{ status: "rejected", reviewRefusal: ["em_dash"] }, "refused"],
    [{ status: "rejected", reviewRefusal: null }, "rejected"],
    [{ status: "rejected", reviewRefusal: [] }, "rejected"],
    [{ status: "approved" }, "approved"],
    [{ status: "sending" }, "approved"],
    [{ status: "sent" }, "sent"],
    [{ status: "failed", failureCode: "platform_rejected" }, "failed"],
  ];
  for (const [overrides, expected] of cases) {
    assert.deepEqual(tabsOf(draft(overrides)), [expected], JSON.stringify(overrides));
  }
});

test("each tab reads only the statuses its drafts can have", () => {
  for (const tab of INBOX_TABS) {
    for (const status of ["pending", "approved", "rejected", "sending", "sent", "failed"] as const) {
      const d = draft({ status, needsHumanReason: tab.id === "for_person" ? "x" : null, reviewRefusal: tab.id === "refused" ? ["smb"] : null });
      if (tab.matches(d)) assert.ok(tab.statuses.includes(status), `${tab.id} matches ${status} but does not read it`);
    }
  }
});

test("a live change replaces, adds or removes a draft", () => {
  const pending = inboxTab("pending");
  const none = new Set<string>();
  const older = draft({ id: "old", createdAt: "2026-11-10T10:00:00Z" });
  const newer = draft({ id: "new", createdAt: "2026-11-11T12:00:00Z" });

  assert.deepEqual(placeDraft([older], newer, pending, none).map((d) => d.id), ["new", "old"]);
  assert.equal(placeDraft([older], { ...older, draftText: "Edited" }, pending, none)[0].draftText, "Edited");
  assert.deepEqual(placeDraft([older], { ...older, status: "sent" }, pending, none), []);
  assert.deepEqual(placeDraft([], { ...older, status: "sent" }, pending, none), []);
});

test("a draft the operator acted on stays in view after it leaves the tab", () => {
  const pending = inboxTab("pending");
  const d = draft({ id: "acted" });
  const sent = { ...d, status: "sent" as const };
  assert.deepEqual(placeDraft([d], sent, pending, new Set(["acted"])), [sent]);
});
