"use client";

import { InboxView } from "@/components/social/InboxView";
import { serverDraftActions } from "@/services/server-draft-actions";
import type { ReplyDraft, SocialAccount } from "@/lib/social/types";

/** The Inbox's drafts with the app's own Server Actions behind their buttons. The page renders this. */
export function InboxList(props: { drafts: ReplyDraft[]; accounts: SocialAccount[]; emptyText: string; truncated: boolean }) {
  return <InboxView {...props} actions={serverDraftActions} />;
}
