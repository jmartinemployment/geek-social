"use client";

import { PostWriter } from "@/components/social/PostWriter";
import type { PlatformCapabilities, SocialAccount } from "@/lib/social/types";
import { serverPostActions } from "@/services/server-post-actions";

/** The post writer with the app's own Server Actions behind its buttons. The page renders this. */
export function AppPostWriter({ accounts, platforms }: { accounts: SocialAccount[]; platforms: PlatformCapabilities[] }) {
  return <PostWriter accounts={accounts} platforms={platforms} actions={serverPostActions} />;
}
