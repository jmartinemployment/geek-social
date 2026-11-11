/**
 * Every code, rule and state GeekSocial sends, in plain words. The one place they are written.
 *
 * A value not listed here is shown as itself, named as unrecognised, so a new code on the server is
 * seen on the screen rather than hidden behind a generic sentence.
 */

/** SocialFailureCodes, plus the Reviewer's review_refused. */
export const FAILURE_WORDS: Record<string, string> = {
  not_supported: "The platform cannot do this. Nothing was sent.",
  invalid_request: "The request broke a rule checked before sending. Nothing was sent.",
  token_invalid: "The platform refused the account's sign-in: it expired, was revoked, or lacks a permission. Reconnect the account.",
  rate_limited: "The platform or a send limit held this back. Nothing was applied; it waits out a cool-down.",
  forbidden: "The account does not have the role or permission this needs.",
  not_found: "The post, comment or account is gone on the platform.",
  platform_rejected: "The platform refused the call and gave a reason. Nothing was applied.",
  platform_unavailable: "The platform could not be reached or failed before accepting the call.",
  outcome_unknown: "The call may have reached the platform but the answer was lost, so it may have been applied. It is never sent again; check on the platform.",
  invalid_signature: "A webhook arrived without a valid signature. Nothing was stored.",
  conflict: "Something changed first: a reply already exists for that comment, or the draft is no longer in the state shown here.",
  store_unavailable: "GeekSocial's store could not be reached or did not finish the write.",
  encryption_unavailable: "The key that protects stored account sign-ins is missing or unusable, so no account can be used.",
  not_configured: "The platform's app settings are not set on GeekAPI, so nothing can be called until they are.",
  clearance_required: "This platform is not cleared to send comment text to Claude, so nothing was sent. Name it in GEEK_SOCIAL_CLAUDE_CLEARED_PLATFORMS on GeekAPI.",
  model_failed: "Claude could not be reached, refused, or answered outside the shape it was given. It is tried once and never retried.",
  review_refused: "The Reviewer refused the text. Nothing was saved or sent.",
};

/** The Reviewer's rules (ReviewRules in GeekSocial). */
export const REVIEW_RULE_WORDS: Record<string, string> = {
  em_dash: "Uses a long dash. Use a comma or a full stop instead.",
  smb: "Says \"SMB\". Write \"small business\" instead.",
  home_address: "Contains a home address.",
  phone_number: "Contains a phone number.",
  email_address: "Contains an email address.",
  unapproved_link: "Contains a link that is not allowed here. A reply may carry only the link of the post it is under.",
  too_long: "Too long. A reply may be up to 1,000 characters and a post up to 2,000.",
};

export const CATEGORY_WORDS: Record<string, string> = {
  question: "Question",
  praise: "Praise",
  complaint: "Complaint",
  spam: "Spam",
  sensitive: "Sensitive",
};

export const DRAFT_STATUS_WORDS: Record<string, string> = {
  pending: "Waiting for a decision",
  approved: "Approved, not sent yet",
  rejected: "Rejected",
  sending: "Sending",
  sent: "Sent",
  failed: "Send failed",
};

export const TRIAGE_OUTCOME_WORDS: Record<string, string> = {
  reply_needed: "Needs a reply",
  no_reply_needed: "No reply needed",
  blocked_no_clearance: "Held: platform not cleared for Claude",
  failed: "Triage failed",
  untriaged: "Waiting for Triage",
};

export const ACCOUNT_STATUS_WORDS: Record<string, string> = {
  connected: "Connected",
  reconnect_required: "Reconnect needed",
};

export const PLATFORM_WORDS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin_organization: "LinkedIn page",
  linkedin_member: "LinkedIn profile",
};

export const AUDIT_ACTION_WORDS: Record<string, string> = {
  connect: "Connected an account",
  refresh_token: "Refreshed an account sign-in",
  subscribe_webhook: "Subscribed to comment updates",
  publish: "Published a post",
  reply: "Sent a reply",
  react: "Liked a comment",
};

export const AUDIT_OUTCOME_WORDS: Record<string, string> = {
  succeeded: "Succeeded",
  failed: "Failed",
  outcome_unknown: "Outcome unknown: check on the platform",
};

export const ENGAGEMENT_KIND_WORDS: Record<string, string> = {
  comment_created: "New comment",
  comment_edited: "Edited comment",
  comment_deleted: "Deleted comment",
  comment_hidden: "Hidden comment",
  comment_unhidden: "Unhidden comment",
  reaction_added: "Reaction added",
  reaction_removed: "Reaction removed",
  share: "Share",
  mention: "Mention",
};

function lookup(table: Record<string, string>, value: string, what: string): string {
  return Object.prototype.hasOwnProperty.call(table, value)
    ? table[value]
    : `Unrecognised ${what} "${value}"`;
}

export const failureWords = (code: string) => lookup(FAILURE_WORDS, code, "failure code");
export const ruleWords = (rule: string) => lookup(REVIEW_RULE_WORDS, rule, "Reviewer rule");
export const categoryWords = (category: string) => lookup(CATEGORY_WORDS, category, "category");
export const draftStatusWords = (status: string) => lookup(DRAFT_STATUS_WORDS, status, "draft status");
export const triageWords = (outcome: string) => lookup(TRIAGE_OUTCOME_WORDS, outcome, "triage outcome");
export const accountStatusWords = (status: string) => lookup(ACCOUNT_STATUS_WORDS, status, "account status");
export const platformWords = (platform: string) => lookup(PLATFORM_WORDS, platform, "platform");
export const auditActionWords = (action: string) => lookup(AUDIT_ACTION_WORDS, action, "action");
export const auditOutcomeWords = (outcome: string) => lookup(AUDIT_OUTCOME_WORDS, outcome, "outcome");
export const engagementKindWords = (kind: string) => lookup(ENGAGEMENT_KIND_WORDS, kind, "kind");
