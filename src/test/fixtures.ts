import type { ReplyDraft, SocialAccount } from "@/lib/social/types";

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
    autoSendCategories: [],
    sendsDisabled: false,
    tokenExpiresAt: null,
    connectedAt: "2026-11-01T00:00:00Z",
    ...overrides,
  };
}
