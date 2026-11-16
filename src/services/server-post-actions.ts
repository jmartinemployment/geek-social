import { publishPostAction, suggestPostCopyAction } from "@/app/(app)/posts/actions";
import { unwrap } from "@/lib/social/action-result";
import type { PostActions } from "@/services/post-actions";

/** The app: every change is a Server Action. */
export const serverPostActions: PostActions = {
  suggestCopy: async (request) => unwrap(await suggestPostCopyAction(request)),
  publish: async (accountId, post) => unwrap(await publishPostAction(accountId, post)),
};
