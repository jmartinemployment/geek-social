"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { metaRedirectUri } from "@/lib/server/meta-redirect";
import { serverTransport } from "@/lib/server/social-api";
import { run, type ActionResult } from "@/lib/social/action-result";
import type { AccountSettings, MetaConnectComplete, ResyncResult, SocialAccount } from "@/lib/social/types";
import { accountApi } from "@/services/social-api";

/** The Accounts changes as Server Actions: one call to GeekAPI as the signed-in person, and what it said. */
const accounts = accountApi(serverTransport);

export async function saveAccountSettingsAction(
  accountId: string,
  settings: AccountSettings,
): Promise<ActionResult<SocialAccount>> {
  await verifySession();
  const result = await run(() => accounts.saveSettings(accountId, settings));
  // The page shows what GeekAPI holds, so it is read again with the answer.
  if (result.ok) revalidatePath("/accounts");
  return result;
}

export async function resyncAccountAction(accountId: string): Promise<ActionResult<ResyncResult>> {
  await verifySession();
  return run(() => accounts.resync(accountId));
}

/**
 * Finishes connecting a Facebook Page: Meta's single-use code goes to GeekAPI once, with the same redirect address the
 * start sent. The address is worked out here, so the browser cannot name a different one.
 */
export async function completeMetaConnectAction(code: string, state: string): Promise<ActionResult<MetaConnectComplete>> {
  await verifySession();
  const result = await run(() => accounts.completeMetaConnect(code, state, metaRedirectUri()));
  if (result.ok) revalidatePath("/accounts");
  return result;
}

/**
 * Starts connecting a Facebook Page: asks GeekAPI for Meta's authorization address and sends the browser there. It
 * returns only when that failed, with GeekAPI's own sentence; on success the redirect leaves this call.
 */
export async function connectMetaAction(): Promise<{ error: string }> {
  await verifySession();
  const started = await run(() => accounts.startMetaConnect(metaRedirectUri()));
  if (!started.ok) return { error: started.error };

  let target: URL;
  try {
    target = new URL(started.value.authorizationUrl);
  } catch {
    return { error: "GeekAPI answered the connect start with an address that is not a web address, so nobody was sent to Meta." };
  }
  if (target.protocol !== "https:") {
    return { error: `GeekAPI answered the connect start with a ${target.protocol} address, not https, so nobody was sent to Meta.` };
  }
  redirect(target.toString());
}
