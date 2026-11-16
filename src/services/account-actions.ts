import type { AccountSettings, ResyncResult, SocialAccount } from "@/lib/social/types";

/** What the Accounts screen does. A failure is thrown as a SocialApiError, whichever way the call travels. */
export interface AccountActions {
  save: (accountId: string, settings: AccountSettings) => Promise<SocialAccount>;
  resync: (accountId: string) => Promise<ResyncResult>;
  /** Starts the Meta connect. On success the browser is sent to Meta and this does not return; it returns GeekAPI's sentence when the start failed. */
  connect: () => Promise<string>;
}
