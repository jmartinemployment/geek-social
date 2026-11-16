import {
  approveDraftAction,
  readDraftAction,
  rejectDraftAction,
  saveDraftTextAction,
  sendDraftAction,
} from "@/app/(app)/inbox-actions";
import { unwrap } from "@/lib/social/action-result";
import type { DraftActions } from "@/services/draft-actions";

/** The app: every change is a Server Action. */
export const serverDraftActions: DraftActions = {
  saveText: async (id, text) => unwrap(await saveDraftTextAction(id, text)),
  approve: async (id) => unwrap(await approveDraftAction(id)),
  send: async (id) => unwrap(await sendDraftAction(id)),
  reject: async (id) => unwrap(await rejectDraftAction(id)),
  read: async (id) => unwrap(await readDraftAction(id)),
};

