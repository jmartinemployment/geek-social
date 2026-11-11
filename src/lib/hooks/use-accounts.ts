"use client";

import { useHubEvent } from "@/components/SocialHubProvider";
import { useResource } from "@/lib/hooks/use-resource";
import type { SocialAccount } from "@/lib/social/types";
import { listAccounts } from "@/services/social-api";

/**
 * The connected accounts, read again whenever the hub says one changed and after every
 * (re)connect. There is no single-account route, so the list is what is read.
 */
export function useAccounts() {
  const accounts = useResource<SocialAccount[]>("accounts", listAccounts);
  useHubEvent("accountChanged", () => accounts.reload());
  useHubEvent("resync", () => accounts.reload());
  return accounts;
}

/** The display name for an account id, or the id itself when the account is not in the list. */
export function accountName(accounts: SocialAccount[] | null, accountId: string | null): string {
  if (!accountId) return "No account";
  const found = accounts?.find((a) => a.id === accountId);
  return found ? found.displayName : `Account ${accountId}`;
}
