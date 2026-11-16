"use client";

import { PostWriter } from "@/components/social/PostWriter";
import type { SocialAccount } from "@/lib/social/types";
import { serverPostActions } from "@/services/server-post-actions";

/** The post writer with the app's own Server Actions behind its buttons. The page renders this. */
export function AppPostWriter({ accounts }: { accounts: SocialAccount[] }) {
  return <PostWriter accounts={accounts} actions={serverPostActions} />;
}
