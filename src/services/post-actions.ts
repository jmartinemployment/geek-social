import type { LinkPost, PostCopyRequest, PostCopyResult, StoredPost } from "@/lib/social/types";

/** What the post writer does. A failure is thrown as a SocialApiError, whichever way the call travels. */
export interface PostActions {
  suggestCopy: (request: PostCopyRequest) => Promise<PostCopyResult>;
  publish: (accountId: string, post: LinkPost) => Promise<StoredPost>;
}
