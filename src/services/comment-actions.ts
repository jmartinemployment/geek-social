import type { ReactResult, RerunResult } from "@/lib/social/types";
import { likeComment, rerunComment } from "@/services/social-api";

/** What a comment card does to a comment. A failure is thrown as a SocialApiError, whichever way the call travels. */
export interface CommentActions {
  rerun: (commentId: string) => Promise<RerunResult>;
  like: (commentId: string) => Promise<ReactResult>;
}

/** Through this app's /api/social proxy with fetch: what the card's tests stand in for. */
export const proxyCommentActions: CommentActions = { rerun: rerunComment, like: likeComment };
