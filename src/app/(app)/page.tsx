import { InboxList } from "@/components/social/InboxList";
import { UrlAccountFilter } from "@/components/UrlAccountFilter";
import { LinkTabs, Notice, PageFrame, Panel } from "@/components/ui";
import { INBOX_TABS, newestFirst } from "@/lib/social/inbox";
import { readAccounts } from "@/lib/server/social-api";
import { LIST_LIMIT, draftApi } from "@/services/social-api";
import { serverTransport } from "@/lib/server/social-api";

/**
 * The Inbox: reply drafts by status, read on the server so the page arrives with its drafts in it. The tab and the
 * account filter are in the address (`?tab=`, `?account=`), the one place the page's state lives. Approve, edit, send
 * and reject are Server Actions run from the cards. A read that fails throws, and the error page says what failed.
 */
export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; account?: string }>;
}) {
  const params = await searchParams;
  const tab = INBOX_TABS.find((t) => t.id === params.tab) ?? INBOX_TABS[0];

  const accounts = await readAccounts();
  const requested = params.account ?? null;
  const accountId = requested && accounts.some((a) => a.id === requested) ? requested : null;

  const api = draftApi(serverTransport);
  const reads = await Promise.all(tab.statuses.map((status) => api.list(status, accountId)));
  const drafts = reads.flat().filter(tab.matches).sort(newestFirst);
  const truncated = reads.some((read) => read.length >= LIST_LIMIT);

  const hrefFor = (id: string) => {
    const next = new URLSearchParams();
    next.set("tab", id);
    if (accountId) next.set("account", accountId);
    return `/?${next.toString()}`;
  };

  return (
    <PageFrame
      title="Inbox"
      intro="Replies Claude drafted for comments on your connected Pages. Nothing is sent until you approve it, unless the account auto-sends that category."
    >
      <Panel aside={<UrlAccountFilter accounts={accounts} value={accountId} />}>
        {requested && !accountId ? (
          <div className="mb-4">
            <Notice tone="warn">The account in the address is not one of yours, so every account is shown.</Notice>
          </div>
        ) : null}
        <LinkTabs
          label="Draft status"
          tabs={INBOX_TABS.map((t) => ({ id: t.id, label: t.label, href: hrefFor(t.id) }))}
          selected={tab.id}
        />
        <InboxList
          key={`${tab.id}|${accountId ?? ""}`}
          drafts={drafts}
          accounts={accounts}
          emptyText={tab.empty}
          truncated={truncated}
        />
      </Panel>
    </PageFrame>
  );
}
