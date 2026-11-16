"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { serverTransport } from "@/lib/server/social-api";
import { run, type ActionResult } from "@/lib/social/action-result";
import type { LinkPost, PostCopyRequest, PostCopyResult, StoredPost } from "@/lib/social/types";
import { postApi } from "@/services/social-api";

/** The Posts changes as Server Actions: one call to GeekAPI as the signed-in person, and what it said. */
const posts = postApi(serverTransport);

export async function suggestPostCopyAction(request: PostCopyRequest): Promise<ActionResult<PostCopyResult>> {
  await verifySession();
  return run(() => posts.suggestCopy(request));
}

export async function publishPostAction(accountId: string, post: LinkPost): Promise<ActionResult<StoredPost>> {
  await verifySession();
  const result = await run(() => posts.publish(accountId, post));
  // The published list is read again with the answer, so the new post is in it.
  if (result.ok) revalidatePath("/posts");
  return result;
}
