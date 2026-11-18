import { Time } from "@/components/Time";
import { Notice } from "@/components/ui";
import type { CommentCounts, DraftCounts, SocialStatus } from "@/lib/social/types";
import { draftStatusWords, failureWords, platformWords, triageWords } from "@/lib/social/words";

// Labelled with the same words the Comments and Inbox pages use for each outcome and status.
const COMMENT_COUNTS: { key: keyof CommentCounts; outcome: string }[] = [
  { key: "undecided", outcome: "untriaged" },
  { key: "replyNeeded", outcome: "reply_needed" },
  { key: "noReplyNeeded", outcome: "no_reply_needed" },
  { key: "blockedNoClearance", outcome: "blocked_no_clearance" },
  { key: "failed", outcome: "failed" },
];

const DRAFT_COUNTS: (keyof DraftCounts)[] = ["pending", "approved", "sending", "sent", "failed", "rejected"];

function Counts({ title, rows }: { title: string; rows: { key: string; label: string; value: number }[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ key, label, value }) => (
          <div key={key} className="flex items-baseline justify-between gap-3 border-b border-border py-1">
            <dt className="text-muted">{label}</dt>
            <dd className="font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Your comments and replies by where they stand, the steps that failed in the last 30 days, the AI provider and its
 * clearance, Meta settings and send limits. Only your own counts and failures, and GeekSocial-wide failures. Pure display.
 */
export function StatusView({ status }: { status: SocialStatus }) {
  const ai = status.aiProvider;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-border bg-background px-4 py-3">
          <p className="text-xs font-semibold text-muted">AI provider</p>
          {ai ? (
            <>
              <p className="mt-1 text-sm text-foreground">{ai.name}</p>
              {ai.model ? (
                <p className="text-xs text-muted">Model {ai.model}</p>
              ) : (
                <p className="text-xs font-semibold text-red-700">No model set</p>
              )}
              {ai.apiKeySet ? null : <p className="text-xs font-semibold text-red-700">No key set</p>}
            </>
          ) : (
            <p className="mt-1 text-sm font-semibold text-red-700">Not set on GeekAPI</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-background px-4 py-3">
          <p className="text-xs font-semibold text-muted">{ai ? `Cleared for ${ai.name}` : "Cleared platforms"}</p>
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

      {!ai ? (
        <Notice tone="warn">
          No AI provider is set on GeekAPI, so every new comment is held, nothing is sent to any AI provider, and no post
          copy can be suggested.
        </Notice>
      ) : !ai.model || !ai.apiKeySet ? (
        <Notice tone="warn">
          {ai.name} is the AI provider, but its {!ai.model && !ai.apiKeySet ? "model and key are" : !ai.model ? "model is" : "key is"}{" "}
          not set on GeekAPI, so every AI call fails and nothing is sent.
        </Notice>
      ) : null}
      {ai && status.clearedPlatforms.length === 0 ? (
        <Notice tone="warn">
          No platform is cleared for {ai.name}, so every new comment is held and nothing is sent to {ai.name}. A platform
          is cleared for one AI provider at a time, so a change of provider clears none. Once a platform is cleared and
          GeekAPI restarts, run the held comments again from the Comments page.
        </Notice>
      ) : null}
      {!status.metaConfigured ? (
        <Notice tone="warn">
          The Meta app id, secret and verify token are not set on GeekAPI, so no Facebook Page can be
          connected and no Facebook webhook can be checked until they are.
        </Notice>
      ) : null}

      <Counts
        title="Your comments"
        rows={COMMENT_COUNTS.map(({ key, outcome }) => ({ key, label: triageWords(outcome), value: status.comments[key] }))}
      />
      <Counts
        title="Your reply drafts"
        rows={DRAFT_COUNTS.map((key) => ({ key, label: draftStatusWords(key), value: status.drafts[key] }))}
      />

      <div>
        <p className="text-sm font-semibold text-foreground">Failures in the last 30 days</p>
        {status.failures.length === 0 ? (
          <p className="mt-1 text-sm text-muted">None.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {status.failures.map((f, i) => (
              <li key={`${f.at}-${i}`} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <span className="font-semibold">
                  <Time value={f.at} />, {f.step}
                  {f.forEveryTenant ? " (GeekSocial-wide)" : null}:
                </span>{" "}
                {failureWords(f.code)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
