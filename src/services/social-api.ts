/**
 * GeekAPI's GeekSocial routes (api/social/*), reached through this app's same-origin proxy at
 * /api/social, which forwards the signed-in person's Bearer token.
 */

import type {
  AccountSettings,
  ApproveResult,
  AuditRow,
  CommentState,
  DraftStatus,
  LinkPost,
  MetaConnectComplete,
  MetaConnectStart,
  PostCopyRequest,
  PostCopyResult,
  ReactResult,
  ReplyDraft,
  RerunResult,
  ResyncResult,
  SendOutcome,
  SocialAccount,
  SocialCommentView,
  SocialStatus,
  StoredPost,
} from "@/lib/social/types";

const API_BASE = "/api/social";

/** The largest page any list route gives (contract: limit is 1 to 200). */
export const LIST_LIMIT = 200;

export class SocialApiError extends Error {
  readonly status: number;
  /** The SocialFailureCodes value GeekAPI answered with, or null when the body carried none. */
  readonly code: string | null;
  /** The Reviewer's broken rules, on a 422 review_refused. Empty otherwise. */
  readonly violations: string[];

  constructor(message: string, status: number, code: string | null, violations: string[]) {
    super(message);
    this.name = "SocialApiError";
    this.status = status;
    this.code = code;
    this.violations = violations;
  }
}

/**
 * Reads a refused response into an error carrying GeekAPI's own sentence, code and violations.
 *
 * GeekAPI answers every failure with `{ error, code }` (and `violations` on review_refused). The
 * proxy answers 401 with `{ error }` and an unreachable GeekAPI with plain text. A 403 from the
 * scope policy may come with no body at all, so it is named for what it means here.
 */
export function refusalFrom(status: number, statusText: string, body: string): SocialApiError {
  let parsed: unknown = null;
  try {
    parsed = body ? JSON.parse(body) : null;
  } catch {
    parsed = null;
  }

  if (parsed && typeof parsed === "object") {
    const fields = parsed as Record<string, unknown>;
    const error = typeof fields.error === "string" ? fields.error.trim() : "";
    const code = typeof fields.code === "string" ? fields.code : null;
    const violations = Array.isArray(fields.violations)
      ? fields.violations.filter((v): v is string => typeof v === "string")
      : [];
    if (error) return new SocialApiError(error, status, code, violations);
    const title = typeof fields.title === "string" ? fields.title.trim() : "";
    const detail = typeof fields.detail === "string" ? fields.detail.trim() : "";
    if (title) {
      return new SocialApiError([title, detail].filter(Boolean).join(" "), status, code, violations);
    }
  }

  if (status === 403 && !body.trim()) {
    return new SocialApiError(
      "Your sign-in does not carry the geeksocial.manage permission. Sign out and back in; if this stays, the account needs that scope granted in GeekOAuth.",
      403,
      null,
      [],
    );
  }
  if (status === 401 && !body.trim()) {
    return new SocialApiError("Your sign-in has ended. Sign in again.", 401, null, []);
  }

  const text = body.trim() || `${status} ${statusText}`.trim();
  return new SocialApiError(`GeekAPI answered ${status}: ${text}`, status, null, []);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new SocialApiError(`Could not reach this app's server: ${detail}`, 0, null, []);
  }

  const body = await response.text();
  if (!response.ok) {
    throw refusalFrom(response.status, response.statusText, body);
  }
  if (!body) {
    throw new SocialApiError(
      `GeekAPI answered ${response.status} with no body where the contract promises one.`,
      response.status,
      null,
      [],
    );
  }
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new SocialApiError(
      `GeekAPI answered ${response.status} with a body that is not JSON: ${body.slice(0, 300)}`,
      response.status,
      null,
      [],
    );
  }
}

/** POST/PUT with a JSON body. */
function send<T>(method: "POST" | "PUT", path: string, payload?: unknown): Promise<T> {
  return request<T>(path, {
    method,
    body: JSON.stringify(payload ?? {}),
  });
}

function query(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

const id = (value: string) => encodeURIComponent(value);

// Status

export const getStatus = () => request<SocialStatus>("/status");

// Accounts

export const listAccounts = () => request<SocialAccount[]>("/accounts");

export const saveAccountSettings = (accountId: string, settings: AccountSettings) =>
  send<SocialAccount>("PUT", `/accounts/${id(accountId)}/settings`, settings);

export const resyncAccount = (accountId: string) =>
  send<ResyncResult>("POST", `/accounts/${id(accountId)}/resync`);

// Connecting a Facebook Page

export const startMetaConnect = (redirectUri: string) =>
  send<MetaConnectStart>("POST", "/connect/meta/start", { redirectUri });

export const completeMetaConnect = (code: string, state: string, redirectUri: string) =>
  send<MetaConnectComplete>("POST", "/connect/meta/complete", { code, state, redirectUri });

// Inbox

export const listDrafts = (status: DraftStatus, accountId: string | null) =>
  request<ReplyDraft[]>(`/drafts${query({ status, accountId, limit: LIST_LIMIT })}`);

export const getDraft = (draftId: string) => request<ReplyDraft>(`/drafts/${id(draftId)}`);

/** Saves new text on a pending draft. The Reviewer checks it first; a refusal is 422 review_refused. */
export const saveDraftText = (draftId: string, draftText: string) =>
  send<ReplyDraft>("PUT", `/drafts/${id(draftId)}`, { draftText });

export const approveDraft = (draftId: string) =>
  send<ApproveResult>("POST", `/drafts/${id(draftId)}/approve`);

/** Sends an approved draft a limit held back. GeekAPI answers `{ draft, send }`, as approve does. */
export async function sendDraft(draftId: string): Promise<SendOutcome> {
  const answer = await send<ApproveResult>("POST", `/drafts/${id(draftId)}/send`);
  return answer.send;
}

/** Rejects a pending or approved draft. */
export const rejectDraft = (draftId: string) =>
  send<ReplyDraft>("POST", `/drafts/${id(draftId)}/reject`);

// Comments

export const listComments = (state: CommentState, accountId: string | null) =>
  request<SocialCommentView[]>(`/comments${query({ state, accountId, limit: LIST_LIMIT })}`);

export const rerunComment = (commentId: string) =>
  send<RerunResult>("POST", `/comments/${id(commentId)}/rerun`);

export const likeComment = (commentId: string) =>
  send<ReactResult>("POST", `/comments/${id(commentId)}/react`, { reactionType: "LIKE" });

// Posts

export const listPosts = (accountId: string | null) =>
  request<StoredPost[]>(`/posts${query({ accountId, limit: LIST_LIMIT })}`);

export const suggestPostCopy = (payload: PostCopyRequest) =>
  send<PostCopyResult>("POST", "/posts/copy", payload);

export const publishPost = (accountId: string, post: LinkPost) =>
  send<StoredPost>("POST", "/posts", { accountId, post });

// Audit

export const listAudit = (accountId: string | null) =>
  request<AuditRow[]>(`/audit${query({ accountId, limit: LIST_LIMIT })}`);

/** The sentence to show for any failure. */
export function errorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
