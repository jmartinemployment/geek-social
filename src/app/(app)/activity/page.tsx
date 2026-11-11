"use client";

import { useState } from "react";
import { AccountFilter } from "@/components/AccountFilter";
import { useHubEvent } from "@/components/SocialHubProvider";
import {
  Badge,
  ErrorNote,
  Loading,
  Notice,
  PageFrame,
  Panel,
  formatTime,
  quietButton,
} from "@/components/ui";
import { accountName, useAccounts } from "@/lib/hooks/use-accounts";
import { useResource } from "@/lib/hooks/use-resource";
import type { AuditRow, OrchestratorStatus, SocialStatus } from "@/lib/social/types";
import {
  auditActionWords,
  auditOutcomeWords,
  failureWords,
  platformWords,
} from "@/lib/social/words";
import { LIST_LIMIT, getStatus, listAudit } from "@/services/social-api";

const COUNTS: { key: Exclude<keyof OrchestratorStatus, "recoveredAt" | "failures">; label: string }[] = [
  { key: "eventsTakenIn", label: "Comments taken in" },
  { key: "commentsReplyNeeded", label: "Needed a reply" },
  { key: "commentsNoReplyNeeded", label: "Needed no reply" },
  { key: "commentsBlockedNoClearance", label: "Held: platform not cleared" },
  { key: "commentsFailed", label: "Triage failed" },
  { key: "draftsPending", label: "Drafts made, waiting for a decision" },
  { key: "draftsForAPerson", label: "Drafts left for a person to write" },
  { key: "draftsRefused", label: "Drafts the Reviewer refused" },
  { key: "draftsSent", label: "Replies sent" },
  { key: "draftsSendFailed", label: "Sends failed" },
  { key: "eventsRecoveredAtStartup", label: "Comments picked up at startup" },
  { key: "interruptedSendsFailed", label: "Sends cut off by a restart, marked failed" },
  { key: "eventsScrubbed", label: "Comments whose text was removed after retention" },
];

/** What GeekSocial is doing: the orchestrator's counts and failures, clearance, and the audit trail. */
export default function ActivityPage() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const accounts = useAccounts();
  const status = useResource<SocialStatus>("status", getStatus);
  const audit = useResource<AuditRow[]>(`audit|${accountId ?? ""}`, () => listAudit(accountId));

  // Every live message can move a count or add an audit row, so both are read again. Bursts are
  // folded into one more read by useResource.
  const refresh = () => {
    status.reload();
    audit.reload();
  };
  useHubEvent("draftChanged", refresh);
  useHubEvent("commentChanged", refresh);
  useHubEvent("accountChanged", refresh);
  useHubEvent("resync", refresh);

  return (
    <PageFrame
      title="Activity"
      intro="What GeekSocial has done and whether it can work: clearance, Meta settings, send limits, and every call that changed something on a platform."
    >
      <Panel
        title="Status"
        aside={
          <>
            {status.refreshing ? <span className="text-sm text-muted">Refreshing…</span> : null}
            <button type="button" onClick={status.reload} className={quietButton}>
              Reload
            </button>
          </>
        }
      >
        {status.loading ? <Loading what="status" /> : null}
        {status.error ? <ErrorNote message={`Status did not load: ${status.error}`} onRetry={status.reload} /> : null}
        {status.data ? <StatusView status={status.data} /> : null}
      </Panel>

      <Panel
        title="Audit"
        aside={
          <>
            <AccountFilter
              accounts={accounts.data}
              accountsError={accounts.error}
              value={accountId}
              onChange={setAccountId}
            />
            <button type="button" onClick={audit.reload} className={quietButton}>
              Reload
            </button>
          </>
        }
      >
        {audit.loading ? <Loading what="the audit" /> : null}
        {audit.error ? <ErrorNote message={`The audit did not load: ${audit.error}`} onRetry={audit.reload} /> : null}
        {audit.data ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted">
              {audit.data.length} {audit.data.length === 1 ? "row" : "rows"}, newest first
              {audit.refreshing ? " · refreshing…" : ""}
            </p>
            {audit.data.length >= LIST_LIMIT ? (
              <Notice tone="warn">
                GeekAPI returns at most {LIST_LIMIT} audit rows, and it returned that many. Older rows
                may exist and are not shown here.
              </Notice>
            ) : null}
            {audit.data.length === 0 ? (
              <p className="text-sm text-muted">Nothing has been done on a platform yet.</p>
            ) : null}
            {audit.data.map((row) => (
              <div key={row.id} className="rounded-lg border border-border bg-background px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{auditActionWords(row.action)}</span>
                  <Badge tone={row.outcome === "succeeded" ? "good" : row.outcome === "failed" ? "bad" : "warn"}>
                    {auditOutcomeWords(row.outcome)}
                  </Badge>
                  <span className="text-xs text-muted">
                    {formatTime(row.occurredAt)} · {accountName(accounts.data, row.accountId)} ·{" "}
                    {platformWords(row.platform)}
                  </span>
                </div>
                {row.failureCode ? (
                  <p className="mt-1 text-red-700">{failureWords(row.failureCode)}</p>
                ) : null}
                {row.failureDetail ? <p className="mt-1 text-red-700">{row.failureDetail}</p> : null}
                <p className="mt-1 text-xs text-muted">
                  {row.actorUserId ? `By ${row.actorUserId}` : "By GeekSocial on its own (auto-sent)"}
                  {row.platformObjectId ? ` · platform id ${row.platformObjectId}` : ""}
                  {row.replyDraftId ? ` · draft ${row.replyDraftId}` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </Panel>
    </PageFrame>
  );
}

function StatusView({ status }: { status: SocialStatus }) {
  const o = status.orchestrator;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-background px-4 py-3">
          <p className="text-xs font-semibold text-muted">Cleared for Claude</p>
          {status.clearedPlatforms.length > 0 ? (
            <p className="mt-1 text-sm text-foreground">
              {status.clearedPlatforms.map(platformWords).join(", ")}
            </p>
          ) : (
            <p className="mt-1 text-sm font-semibold text-red-700">No platform</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-background px-4 py-3">
          <p className="text-xs font-semibold text-muted">Meta app settings</p>
          <p className={`mt-1 text-sm ${status.metaConfigured ? "text-foreground" : "font-semibold text-red-700"}`}>
            {status.metaConfigured ? "Set on GeekAPI" : "Not set on GeekAPI"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background px-4 py-3">
          <p className="text-xs font-semibold text-muted">Send limits</p>
          <p className="mt-1 text-sm text-foreground">
            {status.sendLimits.repliesPerAccountPerHour} replies per account per hour; a{" "}
            {status.sendLimits.coolDownMinutes} minute cool-down after the platform throttles.
          </p>
        </div>
      </div>

      {status.clearedPlatforms.length === 0 ? (
        <Notice tone="warn">
          No platform is cleared, so every new comment is held and nothing is sent to Claude. Comments
          are held until GEEK_SOCIAL_CLAUDE_CLEARED_PLATFORMS on GeekAPI names the platform (for
          example, facebook). After it is set and GeekAPI restarts, run the held comments again from the
          Comments page.
        </Notice>
      ) : null}
      {!status.metaConfigured ? (
        <Notice tone="warn">
          The Meta app id, secret and verify token are not set on GeekAPI, so no Facebook Page can be
          connected and no Facebook webhook can be checked until they are.
        </Notice>
      ) : null}

      <div>
        <p className="text-sm font-semibold text-foreground">Orchestrator</p>
        <p className="text-xs text-muted">
          {o.recoveredAt
            ? `Counts since it started and recovered, ${formatTime(o.recoveredAt)}.`
            : "It has not finished recovering since GeekAPI started."}
        </p>
        <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {COUNTS.map(({ key, label }) => (
            <div key={key} className="flex items-baseline justify-between gap-3 border-b border-border py-1">
              <dt className="text-muted">{label}</dt>
              <dd className="font-medium text-foreground">{o[key]}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">Recent orchestrator failures</p>
        {o.failures.length === 0 ? (
          <p className="mt-1 text-sm text-muted">None.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {o.failures.map((f, i) => (
              <li key={`${f.at}-${i}`} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <span className="font-semibold">{formatTime(f.at)}, {f.step}:</span> {failureWords(f.code)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
