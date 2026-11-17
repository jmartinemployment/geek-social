import { Suspense } from "react";
import { LiveRefresh, ReloadButton } from "@/components/social/LiveRefresh";
import { StatusView } from "@/components/social/StatusView";
import { Time } from "@/components/Time";
import { UrlAccountFilter } from "@/components/UrlAccountFilter";
import { Badge, ErrorNote, Loading, Notice, PageFrame, Panel } from "@/components/ui";
import { quietButton } from "@/components/ui-helpers";
import { readAccounts, serverTransport } from "@/lib/server/social-api";
import { readOrRefusal, resolveAccountFilter } from "@/lib/social/page-reads";
import type { SocialAccount } from "@/lib/social/types";
import { auditActionWords, auditOutcomeWords, failureWords, platformWords } from "@/lib/social/words";
import { LIST_LIMIT, auditApi, statusApi } from "@/services/social-api";

/**
 * What GeekSocial is doing: the orchestrator's counts and failures, clearance, and the audit trail. Nothing here changes
 * anything, so it is all read on the server. The two panels read independently, so one failing does not hide the other,
 * and a failure is said in the panel it belongs to. The account filter is in the address (`?account=`). A live message
 * makes the server read both again.
 */
export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const params = await searchParams;
  const accounts = await readAccounts();
  const { accountId, unknown } = resolveAccountFilter(accounts, params.account ?? null);

  return (
    <PageFrame
      title="Activity"
      intro="What GeekSocial has done and whether it can work: clearance, Meta settings, send limits, and every call that changed something on a platform."
    >
      <LiveRefresh names={["draftChanged", "commentChanged", "accountChanged", "resync"]} />

      <Panel title="Status" aside={<ReloadButton className={quietButton} />}>
        <Suspense fallback={<Loading what="status" />}>
          <StatusPanel />
        </Suspense>
      </Panel>

      <Panel
        title="Audit"
        aside={
          <>
            <UrlAccountFilter accounts={accounts} value={accountId} />
            <ReloadButton className={quietButton} />
          </>
        }
      >
        {unknown ? (
          <div className="mb-4">
            <Notice tone="warn">The account in the address is not one of yours, so every account is shown.</Notice>
          </div>
        ) : null}
        <Suspense key={accountId ?? "all"} fallback={<Loading what="the audit" />}>
          <AuditPanel accountId={accountId} accounts={accounts} />
        </Suspense>
      </Panel>
    </PageFrame>
  );
}

async function StatusPanel() {
  // GeekAPI's own refusal is shown in this panel. Anything else is a bug and reaches the error page.
  const read = await readOrRefusal(() => statusApi(serverTransport).get());
  if (!read.ok) return <ErrorNote message={`Status did not load: ${read.message}`} />;
  return <StatusView status={read.value} />;
}

async function AuditPanel({ accountId, accounts }: { accountId: string | null; accounts: SocialAccount[] }) {
  const read = await readOrRefusal(() => auditApi(serverTransport).list(accountId));
  if (!read.ok) return <ErrorNote message={`The audit did not load: ${read.message}`} />;
  const rows = read.value;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">
        {rows.length} {rows.length === 1 ? "row" : "rows"}, newest first
      </p>
      {rows.length >= LIST_LIMIT ? (
        <Notice tone="warn">
          GeekAPI returns at most {LIST_LIMIT} audit rows, and it returned that many. Older rows may exist and are not
          shown here.
        </Notice>
      ) : null}
      {rows.length === 0 ? <p className="text-sm text-muted">Nothing has been done on a platform yet.</p> : null}
      {rows.map((row) => (
        <div key={row.id} className="rounded-lg border border-border bg-background px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{auditActionWords(row.action)}</span>
            <Badge tone={row.outcome === "succeeded" ? "good" : row.outcome === "failed" ? "bad" : "warn"}>
              {auditOutcomeWords(row.outcome)}
            </Badge>
            <span className="text-xs text-muted">
              <Time value={row.occurredAt} /> ·{" "}
              {row.accountId === null
                ? "No account"
                : (accounts.find((a) => a.id === row.accountId)?.displayName ?? `Account ${row.accountId}`)}{" "}
              · {platformWords(row.platform)}
            </span>
          </div>
          {row.failureCode ? <p className="mt-1 text-red-700">{failureWords(row.failureCode)}</p> : null}
          {row.failureDetail ? <p className="mt-1 text-red-700">{row.failureDetail}</p> : null}
          <p className="mt-1 text-xs text-muted">
            {row.actorUserId ? `By ${row.actorUserId}` : "By GeekSocial on its own (auto-sent)"}
            {row.platformObjectId ? ` · platform id ${row.platformObjectId}` : ""}
            {row.replyDraftId ? ` · draft ${row.replyDraftId}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
