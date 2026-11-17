import { newestFirst, type InboxTab } from "@/lib/social/inbox";
import type { ReplyDraft, SocialAccount } from "@/lib/social/types";
import { LIST_LIMIT, SocialApiError, draftApi, type Transport } from "@/services/social-api";

/**
 * What the server pages decide before they render, kept apart from the pages so it runs without a request: the
 * pages read GeekAPI through the signed-in person's session, and this takes the transport as an argument.
 */

/**
 * The account an address names (`?account=`) for a page that can show every account. A name that is not one of the
 * person's accounts is not used and not hidden: `unknown` is true so the page says every account is shown instead.
 */
export function resolveAccountFilter(
  accounts: readonly SocialAccount[],
  requested: string | null,
): { accountId: string | null; unknown: boolean } {
  const known = requested !== null && requested !== "" && accounts.some((a) => a.id === requested);
  return {
    accountId: known ? requested : null,
    unknown: requested !== null && requested !== "" && !known,
  };
}

/**
 * The account a one-account page shows: the one the address names, else the first connected, else none. `unknown` is
 * true when the address named an account that is not the person's, so the page says which one it shows instead.
 */
export function resolveChosenAccount(
  accounts: readonly SocialAccount[],
  requested: string | null,
): { chosen: SocialAccount | null; unknown: boolean } {
  const named = accounts.find((a) => a.id === requested);
  return {
    chosen: named ?? accounts[0] ?? null,
    unknown: requested !== null && requested !== "" && named === undefined,
  };
}

/**
 * The drafts one Inbox tab shows. A tab can span several statuses, so each is read, and the tab's own test then splits
 * the statuses it shares with another tab. `truncated` is true when any read came back at GeekAPI's limit, because
 * older drafts may exist that were not returned.
 */
export async function readInbox(
  call: Transport,
  tab: InboxTab,
  accountId: string | null,
): Promise<{ drafts: ReplyDraft[]; truncated: boolean }> {
  const api = draftApi(call);
  const reads = await Promise.all(tab.statuses.map((status) => api.list(status, accountId)));
  return {
    drafts: reads.flat().filter(tab.matches).sort(newestFirst),
    truncated: reads.some((read) => read.length >= LIST_LIMIT),
  };
}

/**
 * Runs one panel's read. GeekAPI's own refusal is returned as its message, for the panel to show where the data would
 * be. Anything else (a bug, a redirect to sign-in) is rethrown untouched, so it reaches the error page or Next.js.
 */
export async function readOrRefusal<T>(
  read: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; message: string }> {
  try {
    return { ok: true, value: await read() };
  } catch (err) {
    if (!(err instanceof SocialApiError)) throw err;
    return { ok: false, message: err.message };
  }
}
