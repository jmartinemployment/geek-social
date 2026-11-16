import { likeCommentAction, rerunCommentAction } from "@/app/(app)/comments/actions";
import { unwrap } from "@/lib/social/action-result";
import type { CommentActions } from "@/services/comment-actions";

/** The app: every change is a Server Action. */
export const serverCommentActions: CommentActions = {
  rerun: async (id) => unwrap(await rerunCommentAction(id)),
  like: async (id) => unwrap(await likeCommentAction(id)),
};
