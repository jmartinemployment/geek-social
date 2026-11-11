import type { DraftStatus, ReplyDraft } from "@/lib/social/types";

/**
 * The Inbox tabs. Each names the statuses it reads from GeekAPI and the test a draft must pass to
 * sit in it, so the split between tabs that share a status (pending: for the drafter or for a
 * person; rejected: by the Reviewer or by a person) is decided in one place.
 */
export type InboxTabId =
  | "pending"
  | "for_person"
  | "refused"
  | "rejected"
  | "approved"
  | "sent"
  | "failed";

export interface InboxTab {
  id: InboxTabId;
  label: string;
  statuses: DraftStatus[];
  matches: (draft: ReplyDraft) => boolean;
  empty: string;
}

const refused = (d: ReplyDraft) => (d.reviewRefusal?.length ?? 0) > 0;

export const INBOX_TABS: readonly InboxTab[] = [
  {
    id: "pending",
    label: "Pending",
    statuses: ["pending"],
    matches: (d) => d.status === "pending" && d.needsHumanReason === null,
    empty: "No drafts are waiting for a decision.",
  },
  {
    id: "for_person",
    label: "For a person",
    statuses: ["pending"],
    matches: (d) => d.status === "pending" && d.needsHumanReason !== null,
    empty: "No comments are waiting for a person to write the reply.",
  },
  {
    id: "refused",
    label: "Refused",
    statuses: ["rejected"],
    matches: (d) => d.status === "rejected" && refused(d),
    empty: "The Reviewer has refused no drafts.",
  },
  {
    id: "rejected",
    label: "Rejected",
    statuses: ["rejected"],
    matches: (d) => d.status === "rejected" && !refused(d),
    empty: "No drafts have been rejected by a person.",
  },
  {
    id: "approved",
    label: "Approved, held",
    statuses: ["approved", "sending"],
    matches: (d) => d.status === "approved" || d.status === "sending",
    empty: "No approved drafts are waiting to go out.",
  },
  {
    id: "sent",
    label: "Sent",
    statuses: ["sent"],
    matches: (d) => d.status === "sent",
    empty: "No replies have been sent.",
  },
  {
    id: "failed",
    label: "Failed",
    statuses: ["failed"],
    matches: (d) => d.status === "failed",
    empty: "No sends have failed.",
  },
];

export function inboxTab(id: InboxTabId): InboxTab {
  const tab = INBOX_TABS.find((t) => t.id === id);
  if (!tab) throw new Error(`Unknown Inbox tab "${id}".`);
  return tab;
}

/** Newest first, as GeekAPI lists them. */
export function newestFirst(a: ReplyDraft, b: ReplyDraft): number {
  return b.createdAt.localeCompare(a.createdAt);
}

/**
 * Puts a draft read after a live message into the list on screen: replaced where it is, added when
 * it now belongs to this tab, and taken out when it no longer does, unless the operator acted on it
 * here (`kept`), so the outcome of their own action stays in view.
 */
export function placeDraft(
  list: ReplyDraft[],
  draft: ReplyDraft,
  tab: InboxTab,
  kept: ReadonlySet<string>,
): ReplyDraft[] {
  const present = list.some((d) => d.id === draft.id);
  const belongs = tab.matches(draft) || kept.has(draft.id);
  if (present && belongs) return list.map((d) => (d.id === draft.id ? draft : d));
  if (present) return list.filter((d) => d.id !== draft.id);
  if (belongs) return [...list, draft].sort(newestFirst);
  return list;
}
