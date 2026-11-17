import { InboxList } from "@/components/social/InboxList";
import { UrlAccountFilter } from "@/components/UrlAccountFilter";
import { LinkTabs, Notice, PageFrame, Panel } from "@/components/ui";
import { INBOX_TABS } from "@/lib/social/inbox";
import { readInbox, resolveAccountFilter } from "@/lib/social/page-reads";
import { readAccounts, serverTransport } from "@/lib/server/social-api";

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
  const { accountId, unknown } = resolveAccountFilter(accounts, params.account ?? null);
  const { drafts, truncated } = await readInbox(serverTransport, tab, accountId);

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
        {unknown ? (
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
