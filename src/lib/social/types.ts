/**
 * The GeekSocial wire shapes, exactly as GeekBackend/docs/GEEK-SOCIAL-API.md states them.
 * JSON is camelCase; times are UTC ISO 8601 strings.
 */

export type Platform = "facebook" | "instagram" | "linkedin_organization" | "linkedin_member";

export type ReplyCategory = "question" | "praise" | "complaint" | "spam" | "sensitive";

/** The only categories an account may send without approval. Complaint and sensitive never auto-send. */
export const AUTO_SEND_CATEGORIES = ["question", "praise", "spam"] as const;
export type AutoSendCategory = (typeof AUTO_SEND_CATEGORIES)[number];

export type AccountStatus = "connected" | "reconnect_required";

export interface SocialAccount {
  id: string;
  platform: Platform;
  platformAccountId: string;
  displayName: string;
  status: AccountStatus;
  autoSendCategories: string[];
  sendsDisabled: boolean;
  tokenExpiresAt: string | null;
  connectedAt: string;
}

export interface AccountSettings {
  autoSendCategories: AutoSendCategory[];
  sendsDisabled: boolean;
}

export interface ResyncResult {
  postsRead: number;
  commentsRead: number;
  stored: number;
}

export interface MetaConnectStart {
  authorizationUrl: string;
}

export interface MetaConnectComplete {
  accounts: SocialAccount[];
  subscriptions: { accountId: string; active: boolean }[];
}

export type DraftStatus = "pending" | "approved" | "rejected" | "sending" | "sent" | "failed";

export interface DraftComment {
  eventId: string;
  /** Null once the comment's retention has run out. */
  text: string | null;
  /** Null once the commenter's retention has run out. */
  authorDisplayName: string | null;
  platformPostId: string;
  platformCommentId: string;
  occurredAt: string;
}

export interface ReplyDraft {
  id: string;
  accountId: string;
  platform: Platform;
  category: ReplyCategory;
  draftText: string;
  needsHumanReason: string | null;
  reviewRefusal: string[] | null;
  status: DraftStatus;
  sentPlatformCommentId: string | null;
  failureCode: string | null;
  createdAt: string;
  decidedAt: string | null;
  sendingStartedAt: string | null;
  comment: DraftComment;
}

export interface SendOutcome {
  sent: boolean;
  held: boolean;
  code: string | null;
  error: string | null;
  retryAfter: string | null;
}

export interface ApproveResult {
  draft: ReplyDraft;
  send: SendOutcome;
}

export type TriageOutcome = "reply_needed" | "no_reply_needed" | "blocked_no_clearance" | "failed";
export type CommentState = TriageOutcome | "untriaged";

export interface SocialCommentView {
  id: string;
  accountId: string;
  platform: Platform;
  kind: string;
  platformPostId: string;
  platformCommentId: string;
  authorDisplayName: string | null;
  text: string | null;
  occurredAt: string;
  triageOutcome: TriageOutcome | null;
  triageFailureCode: string | null;
  triagedAt: string | null;
}

export interface RerunResult {
  outcome: string;
}

export interface ReactResult {
  platformReactionId: string | null;
}

export interface LinkPost {
  kind: "link";
  text: string;
  linkUrl: string;
  linkTitle: string | null;
  linkDescription: string | null;
  imageUrl: string | null;
  scheduledFor: string | null;
}

export interface PostCopyRequest {
  articleUrl: string;
  articleTitle: string;
  articleSummary: string;
  platforms: Platform[];
  imageUrl: string | null;
}

export interface PostCopyResult {
  copies: { platform: Platform; post: LinkPost }[];
}

/**
 * A stored post. The contract does not spell this shape out; these are the members of GeekSocial's
 * stored post record (SocialPost in GeekApplication/Models/Social/SocialRecords.cs), camelCased.
 */
export interface StoredPost {
  id: string;
  accountId: string;
  platform: Platform;
  platformPostId: string;
  kind: string;
  text: string;
  linkUrl: string | null;
  scheduledFor: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface AuditRow {
  id: string;
  accountId: string | null;
  platform: Platform;
  action: string;
  outcome: "succeeded" | "failed" | "outcome_unknown";
  platformObjectId: string | null;
  replyDraftId: string | null;
  failureCode: string | null;
  failureDetail: string | null;
  actorUserId: string | null;
  occurredAt: string;
}

export interface OrchestratorFailure {
  step: string;
  code: string;
  at: string;
}

export interface OrchestratorStatus {
  recoveredAt: string | null;
  eventsRecoveredAtStartup: number;
  interruptedSendsFailed: number;
  eventsScrubbed: number;
  eventsTakenIn: number;
  commentsReplyNeeded: number;
  commentsNoReplyNeeded: number;
  commentsBlockedNoClearance: number;
  commentsFailed: number;
  draftsPending: number;
  draftsForAPerson: number;
  draftsRefused: number;
  draftsSent: number;
  draftsSendFailed: number;
  failures: OrchestratorFailure[];
}

export interface SocialStatus {
  orchestrator: OrchestratorStatus;
  clearedPlatforms: string[];
  metaConfigured: boolean;
  sendLimits: { repliesPerAccountPerHour: number; coolDownMinutes: number };
}

/** SignalR message bodies. Ids and states only, never text. */
export interface DraftChangedMessage {
  draftId: string;
  accountId: string;
  status: DraftStatus;
}

export interface CommentChangedMessage {
  eventId: string;
  accountId: string;
  outcome: string;
}

export interface AccountChangedMessage {
  accountId: string;
  status: AccountStatus;
}
