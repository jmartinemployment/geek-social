import type { ApproveResult, ReplyDraft, SendOutcome } from "@/lib/social/types";

/** What a draft card does to a draft. A failure is thrown as a SocialApiError, whichever way the call travels. */
export interface DraftActions {
  saveText: (draftId: string, text: string) => Promise<ReplyDraft>;
  approve: (draftId: string) => Promise<ApproveResult>;
  send: (draftId: string) => Promise<SendOutcome>;
  reject: (draftId: string) => Promise<ReplyDraft>;
  read: (draftId: string) => Promise<ReplyDraft>;
}
