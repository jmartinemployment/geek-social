"use server";

import { verifySession } from "@/lib/dal";
import { serverTransport } from "@/lib/server/social-api";
import { run, type ActionResult } from "@/lib/social/action-result";
import type { ReactResult, RerunResult } from "@/lib/social/types";
import { commentApi } from "@/services/social-api";

/** The Comments changes as Server Actions: one call to GeekAPI as the signed-in person, and what it said. */
const comments = commentApi(serverTransport);

export async function rerunCommentAction(commentId: string): Promise<ActionResult<RerunResult>> {
  await verifySession();
  return run(() => comments.rerun(commentId));
}

export async function likeCommentAction(commentId: string): Promise<ActionResult<ReactResult>> {
  await verifySession();
  return run(() => comments.like(commentId));
}
