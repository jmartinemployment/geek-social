"use client";

import { CommentsView } from "@/components/social/CommentsView";
import type { CommentTab } from "@/lib/social/comments";
import type { SocialAccount, SocialCommentView } from "@/lib/social/types";
import { serverCommentActions } from "@/services/server-comment-actions";

/** The Comments list with the app's own Server Actions behind its buttons. The page renders this. */
export function CommentsList(props: { comments: SocialCommentView[]; accounts: SocialAccount[]; tab: CommentTab }) {
  return <CommentsView {...props} actions={serverCommentActions} />;
}
