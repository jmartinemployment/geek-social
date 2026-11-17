import { CommentsList } from "@/components/social/CommentsList";
import { UrlAccountFilter } from "@/components/UrlAccountFilter";
import { LinkTabs, Notice, PageFrame, Panel } from "@/components/ui";
import { COMMENT_TABS } from "@/lib/social/comments";
import { resolveAccountFilter } from "@/lib/social/page-reads";
import { readAccounts, serverTransport } from "@/lib/server/social-api";
import { commentApi } from "@/services/social-api";

/**
 * Comments that did not become a draft in the Inbox, read on the server. The tab and the account filter are in the
 * address (`?tab=`, `?account=`); Run again and Like are Server Actions run from the cards. A read that fails throws,
 * and the error page says what failed.
 */
export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; account?: string }>;
}) {
  const params = await searchParams;
  const tab = COMMENT_TABS.find((t) => t.id === params.tab) ?? COMMENT_TABS[0];

  const accounts = await readAccounts();
  const { accountId, unknown } = resolveAccountFilter(accounts, params.account ?? null);
  const comments = await commentApi(serverTransport).list(tab.state, accountId);

  const hrefFor = (id: string) => {
    const next = new URLSearchParams({ tab: id });
    if (accountId) next.set("account", accountId);
    return `/comments?${next.toString()}`;
  };

  return (
    <PageFrame
      title="Comments"
      intro="Comments that did not become a draft in the Inbox. A held or failed comment can be run through Triage again."
    >
      <Panel aside={<UrlAccountFilter accounts={accounts} value={accountId} />}>
        {unknown ? (
          <div className="mb-4">
            <Notice tone="warn">The account in the address is not one of yours, so every account is shown.</Notice>
          </div>
        ) : null}
        <LinkTabs
          label="Comment state"
          tabs={COMMENT_TABS.map((t) => ({ id: t.id, label: t.label, href: hrefFor(t.id) }))}
          selected={tab.id}
        />
        <CommentsList key={`${tab.id}|${accountId ?? ""}`} comments={comments} accounts={accounts} tab={tab} />
      </Panel>
    </PageFrame>
  );
}
