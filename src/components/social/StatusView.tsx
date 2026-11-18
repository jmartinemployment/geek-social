import { Time } from "@/components/Time";
import { Notice } from "@/components/ui";
import type { OrchestratorStatus, SocialStatus } from "@/lib/social/types";
import { failureWords, platformWords } from "@/lib/social/words";

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
  { key: "sendsHeld", label: "Sends held back by a limit" },
  { key: "eventsRecoveredAtStartup", label: "Comments picked up at startup" },
  { key: "interruptedSendsFailed", label: "Sends cut off by a restart, marked failed" },
  { key: "eventsScrubbed", label: "Comments whose text was removed after retention" },
];

/** The orchestrator's counts and failures, the AI provider and its clearance, Meta settings and send limits. Pure display. */
export function StatusView({ status }: { status: SocialStatus }) {
  const o = status.orchestrator;
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

      <div>
        <p className="text-sm font-semibold text-foreground">Orchestrator</p>
        <p className="text-xs text-muted">
          {o.recoveredAt ? (
            <>
              Counts since it started and recovered, <Time value={o.recoveredAt} />.
            </>
          ) : (
            "It has not finished recovering since GeekAPI started."
          )}
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
                <span className="font-semibold"><Time value={f.at} />, {f.step}:</span> {failureWords(f.code)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
