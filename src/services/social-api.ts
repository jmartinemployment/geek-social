/**
 * GeekAPI's GeekSocial routes (api/social/*). Each call is made over a `Transport`; the server's is in
 * `@/lib/server/social-api` and sends the signed-in person's Bearer token from the session cookie. The browser makes
 * none of these calls: nothing here reaches GeekAPI from client code.
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
 * GeekAPI answers every failure with `{ error, code }` (and `violations` on review_refused). A 403 from the
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

/**
 * Reads GeekAPI's answer into the value it promises, or into the error that names what went wrong.
 */
export async function readAnswer<T>(response: Response): Promise<T> {
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

function query(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

const id = (value: string) => encodeURIComponent(value);

// Accounts

/** The account calls over one transport. */
export function accountApi(call: Transport) {
  return {
    list: () => call<SocialAccount[]>("GET", "/accounts"),
    saveSettings: (accountId: string, settings: AccountSettings) =>
      call<SocialAccount>("PUT", `/accounts/${id(accountId)}/settings`, settings),
    resync: (accountId: string) => call<ResyncResult>("POST", `/accounts/${id(accountId)}/resync`, {}),
    // Connecting a Facebook Page
    startMetaConnect: (redirectUri: string) => call<MetaConnectStart>("POST", "/connect/meta/start", { redirectUri }),
    completeMetaConnect: (code: string, state: string, redirectUri: string) =>
      call<MetaConnectComplete>("POST", "/connect/meta/complete", { code, state, redirectUri }),
  };
}

// Inbox

/** How a call reaches GeekAPI. Paths follow /api/social. */
export type Transport = <T>(method: "GET" | "POST" | "PUT", path: string, payload?: unknown) => Promise<T>;

/**
 * A draft action whose answer does not carry what the screen acts on is refused by name. The action
 * may still have happened, so the message says to read the draft rather than guessing; the status
 * (200) is what marks the answer as unreliable to callers.
 */
function unreadableAnswer(route: string, missing: string): SocialApiError {
  return new SocialApiError(
    `GeekAPI answered ${route} without ${missing}, so the result is not known. The action may have happened; the draft is read again below.`,
    200,
    null,
    [],
  );
}

function isSendOutcome(value: unknown): value is SendOutcome {
  if (!value || typeof value !== "object") return false;
  const fields = value as Record<string, unknown>;
  return typeof fields.sent === "boolean" && typeof fields.held === "boolean";
}

function isDraft(value: unknown): value is ReplyDraft {
  if (!value || typeof value !== "object") return false;
  const fields = value as Record<string, unknown>;
  return typeof fields.id === "string" && typeof fields.status === "string";
}

/** The reply-draft calls over one transport, refusing answers that lack what the screen acts on. */
export function draftApi(call: Transport) {
  return {
    list: (status: DraftStatus, accountId: string | null) =>
      call<ReplyDraft[]>("GET", `/drafts${query({ status, accountId, limit: LIST_LIMIT })}`),

    get: (draftId: string) => call<ReplyDraft>("GET", `/drafts/${id(draftId)}`),

    /** Saves new text on a pending draft. The Reviewer checks it first; a refusal is 422 review_refused. */
    saveText: (draftId: string, draftText: string) => call<ReplyDraft>("PUT", `/drafts/${id(draftId)}`, { draftText }),

    approve: async (draftId: string): Promise<ApproveResult> => {
      const answer = await call<Partial<ApproveResult> | null>("POST", `/drafts/${id(draftId)}/approve`);
      if (!isSendOutcome(answer?.send)) throw unreadableAnswer("the approve", "a send outcome");
      if (!isDraft(answer?.draft)) throw unreadableAnswer("the approve", "the draft");
      return { draft: answer.draft, send: answer.send };
    },

    /** Sends an approved draft a limit held back. GeekAPI answers `{ draft, send }`, as approve does. */
    send: async (draftId: string): Promise<SendOutcome> => {
      const answer = await call<Partial<ApproveResult> | null>("POST", `/drafts/${id(draftId)}/send`);
      if (!isSendOutcome(answer?.send)) throw unreadableAnswer("the send", "a send outcome");
      return answer.send;
    },

    /** Rejects a pending or approved draft. */
    reject: (draftId: string) => call<ReplyDraft>("POST", `/drafts/${id(draftId)}/reject`),
  };
}

// Comments

/** The comment calls over one transport. */
export function commentApi(call: Transport) {
  return {
    list: (state: CommentState, accountId: string | null) =>
      call<SocialCommentView[]>("GET", `/comments${query({ state, accountId, limit: LIST_LIMIT })}`),
    rerun: (commentId: string) => call<RerunResult>("POST", `/comments/${id(commentId)}/rerun`, {}),
    like: (commentId: string) => call<ReactResult>("POST", `/comments/${id(commentId)}/react`, { reactionType: "LIKE" }),
  };
}

// Posts

/** The post calls over one transport. */
export function postApi(call: Transport) {
  return {
    /** GeekAPI refuses this route without an account (400 "accountId is required"), so one is required here. */
    list: (accountId: string) => call<StoredPost[]>("GET", `/posts${query({ accountId, limit: LIST_LIMIT })}`),
    suggestCopy: (payload: PostCopyRequest) => call<PostCopyResult>("POST", "/posts/copy", payload),
    publish: (accountId: string, post: LinkPost) => call<StoredPost>("POST", "/posts", { accountId, post }),
  };
}

// Status and audit

/** The status call over one transport. */
export function statusApi(call: Transport) {
  return { get: () => call<SocialStatus>("GET", "/status") };
}

export function auditApi(call: Transport) {
  return { list: (accountId: string | null) => call<AuditRow[]>("GET", `/audit${query({ accountId, limit: LIST_LIMIT })}`) };
}

export { errorText } from "@/lib/errors";
