"use server";

import { verifySession } from "@/lib/dal";
import { run, type ActionResult } from "@/lib/social/action-result";
import { serverTransport } from "@/lib/server/social-api";
import type { ApproveResult, ReplyDraft, SendOutcome } from "@/lib/social/types";
import { draftApi } from "@/services/social-api";

/**
 * The Inbox's changes, as Server Actions: each checks the person is signed in, calls GeekAPI with their token on the
 * server, and answers with the result or with GeekAPI's own refusal as data. Nothing here retries or guesses: one call,
 * and what GeekAPI said.
 */
const drafts = draftApi(serverTransport);

export async function saveDraftTextAction(draftId: string, text: string): Promise<ActionResult<ReplyDraft>> {
  await verifySession();
  return run(() => drafts.saveText(draftId, text));
}

export async function approveDraftAction(draftId: string): Promise<ActionResult<ApproveResult>> {
  await verifySession();
  return run(() => drafts.approve(draftId));
}

export async function sendDraftAction(draftId: string): Promise<ActionResult<SendOutcome>> {
  await verifySession();
  return run(() => drafts.send(draftId));
}

export async function rejectDraftAction(draftId: string): Promise<ActionResult<ReplyDraft>> {
  await verifySession();
  return run(() => drafts.reject(draftId));
}

export async function readDraftAction(draftId: string): Promise<ActionResult<ReplyDraft>> {
  await verifySession();
  return run(() => drafts.get(draftId));
}
