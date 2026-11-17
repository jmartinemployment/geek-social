import type { ReactResult, RerunResult } from "@/lib/social/types";

/** What a comment card does to a comment. A failure is thrown as a SocialApiError, whichever way the call travels. */
export interface CommentActions {
  rerun: (commentId: string) => Promise<RerunResult>;
  like: (commentId: string) => Promise<ReactResult>;
}
