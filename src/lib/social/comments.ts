import type { CommentState } from "@/lib/social/types";

export type CommentTabId = "held" | "failed" | "waiting" | "no_reply";

export interface CommentTab {
  id: CommentTabId;
  label: string;
  state: CommentState;
  empty: string;
}

/** The Comments tabs: each is a state GeekAPI lists comments by, and what an empty one says. */
export const COMMENT_TABS: readonly CommentTab[] = [
  { id: "held", label: "Held", state: "blocked_no_clearance", empty: "No comments are held for clearance." },
  { id: "failed", label: "Failed", state: "failed", empty: "No comments failed Triage." },
  { id: "waiting", label: "Waiting", state: "untriaged", empty: "No comments are waiting for Triage." },
  { id: "no_reply", label: "No reply needed", state: "no_reply_needed", empty: "No comments were judged to need no reply." },
];

/** Only a held or failed comment can be run through Triage again. */
export const isRerunnable = (tab: CommentTab) => tab.state === "blocked_no_clearance" || tab.state === "failed";
