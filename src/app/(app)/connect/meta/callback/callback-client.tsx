"use client";

import { completeMetaConnectAction } from "@/app/(app)/accounts/actions";
import { unwrap } from "@/lib/social/action-result";
import { MetaCallbackView } from "./callback-view";

const complete = async (code: string, state: string) => unwrap(await completeMetaConnectAction(code, state));

/** The Meta callback with the app's own Server Action behind it. The page renders this. */
export function MetaCallbackClient() {
  return <MetaCallbackView complete={complete} />;
}
