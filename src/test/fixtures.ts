import type { ReplyDraft, SocialAccount, SocialCommentView, StoredPost } from "@/lib/social/types";

export function draft(overrides: Partial<ReplyDraft> = {}): ReplyDraft {
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

export function account(overrides: Partial<SocialAccount> = {}): SocialAccount {
  return {
    id: "a1",
    platform: "facebook",
    platformAccountId: "fb-1",
    displayName: "Acme Page",
    status: "connected",
    sendsDisabled: false,
    tokenExpiresAt: null,
    connectedAt: "2026-11-01T00:00:00Z",
    ...overrides,
  };
}

export function storedPost(overrides: Partial<StoredPost> = {}): StoredPost {
  return {
    id: "post1",
    accountId: "a1",
    platform: "facebook",
    platformPostId: "fb-post-1",
    kind: "link",
    text: "Read our latest guide.",
    linkUrl: "https://geekatyourspot.com/guide",
    scheduledFor: null,
    publishedAt: "2026-11-15T12:00:00Z",
    createdAt: "2026-11-15T11:59:00Z",
    ...overrides,
  };
}

export function commentView(overrides: Partial<SocialCommentView> = {}): SocialCommentView {
  return {
    id: "c1",
    accountId: "a1",
    platform: "facebook",
    kind: "comment",
    platformPostId: "p1",
    platformCommentId: "fb-c1",
    authorDisplayName: "Sam",
    text: "Is this open on Sundays?",
    occurredAt: "2026-11-16T11:59:00Z",
    triageOutcome: "failed",
    triageFailureCode: "triage_failed",
    triagedAt: "2026-11-16T12:00:00Z",
    ...overrides,
  };
}
