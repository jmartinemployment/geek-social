"use client";

import { useState } from "react";
import Link from "next/link";
import { AccountFilter } from "@/components/AccountFilter";
import { useHubEvent } from "@/components/SocialHubProvider";
import {
  Badge,
  ErrorNote,
  Loading,
  Notice,
  PageFrame,
  Panel,
  Tabs,
  formatTime,
  quietButton,
  secondaryButton,
} from "@/components/ui";
import { accountName, useAccounts } from "@/lib/hooks/use-accounts";
import { useResource } from "@/lib/hooks/use-resource";
import type { CommentState, SocialAccount, SocialCommentView } from "@/lib/social/types";
import { engagementKindWords, failureWords, platformWords, triageWords } from "@/lib/social/words";
import { LIST_LIMIT, errorText, likeComment, listComments, rerunComment } from "@/services/social-api";

type CommentTabId = "held" | "failed" | "waiting" | "no_reply";

const TABS: readonly { id: CommentTabId; label: string; state: CommentState; empty: string }[] = [
  { id: "held", label: "Held", state: "blocked_no_clearance", empty: "No comments are held for clearance." },
  { id: "failed", label: "Failed", state: "failed", empty: "No comments failed Triage." },
  { id: "waiting", label: "Waiting", state: "untriaged", empty: "No comments are waiting for Triage." },
  { id: "no_reply", label: "No reply needed", state: "no_reply_needed", empty: "No comments were judged to need no reply." },
];

/** Comments that did not become a draft: held, failed, waiting, or judged to need no reply. */
export default function CommentsPage() {
  const [tabId, setTabId] = useState<CommentTabId>("held");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [notices, setNotices] = useState<{ tone: "good" | "info"; text: string }[]>([]);
  const accounts = useAccounts();
  const tab = TABS.find((t) => t.id === tabId) ?? TABS[0];

  const list = useResource<SocialCommentView[]>(`${tabId}|${accountId ?? ""}`, () =>
    listComments(tab.state, accountId),
  );

  // There is no route for one comment, so a change is read by reading the open tab again.
  useHubEvent("commentChanged", () => list.reload());
  useHubEvent("resync", () => list.reload());

  const rerunnable = tab.state === "blocked_no_clearance" || tab.state === "failed";

  return (
    <PageFrame
      title="Comments"
      intro="Comments that did not become a draft in the Inbox. A held or failed comment can be run through Triage again."
    >
      <Panel
        aside={
          <AccountFilter
            accounts={accounts.data}
            accountsError={accounts.error}
            value={accountId}
            onChange={setAccountId}
          />
        }
      >
        <Tabs label="Comment state" tabs={TABS} selected={tabId} onSelect={setTabId} />

        <div className="mt-4 flex flex-col gap-3">
          {tab.state === "blocked_no_clearance" ? (
            <Notice tone="info">
              GeekSocial sends a comment to Claude only for a platform named in
              GEEK_SOCIAL_CLAUDE_CLEARED_PLATFORMS on GeekAPI. Until the platform is named there, its
              comments are held here and nothing is sent. Once it is set, press Run again on each comment.
              The <Link href="/activity" className="font-semibold underline">Activity</Link> page shows
              which platforms are cleared now.
            </Notice>
          ) : null}

          {notices.map((n, i) => (
            <Notice
              key={i}
              tone={n.tone}
              onDismiss={() => setNotices((prev) => prev.filter((_, j) => j !== i))}
            >
              {n.text}
            </Notice>
          ))}

          {list.loading ? <Loading what="comments" /> : null}
          {list.error ? <ErrorNote message={`Comments did not load: ${list.error}`} onRetry={list.reload} /> : null}

          {list.data ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                <span>
                  {list.data.length} {list.data.length === 1 ? "comment" : "comments"}
                  {list.refreshing ? " · refreshing…" : ""}
                </span>
                <button type="button" onClick={list.reload} className={quietButton}>
                  Reload
                </button>
              </div>
              {list.data.length >= LIST_LIMIT ? (
                <Notice tone="warn">
                  GeekAPI returns at most {LIST_LIMIT} comments, and it returned that many. Older
                  comments in this state may exist and are not shown here.
                </Notice>
              ) : null}
              {list.data.length === 0 ? <p className="text-sm text-muted">{tab.empty}</p> : null}
              {list.data.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  accounts={accounts.data}
                  rerunnable={rerunnable}
                  onRerun={(text) => {
                    setNotices((prev) => [...prev, { tone: "good", text }]);
                    list.reload();
                  }}
                />
              ))}
            </>
          ) : null}
        </div>
      </Panel>
    </PageFrame>
  );
}

function CommentCard({
  comment,
  accounts,
  rerunnable,
  onRerun,
}: {
  comment: SocialCommentView;
  accounts: SocialAccount[] | null;
  rerunnable: boolean;
  onRerun: (notice: string) => void;
}) {
  const [busy, setBusy] = useState<"rerun" | "like" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState<string | null>(null);
  const author = comment.authorDisplayName ?? "Commenter name removed after its retention period";

  async function rerun() {
    setBusy("rerun");
    setError(null);
    try {
      const result = await rerunComment(comment.id);
      onRerun(`Triage ran again on the comment by ${author}: ${triageWords(result.outcome)}.`);
    } catch (err) {
      setError(`Run again failed: ${errorText(err)}`);
    }
    setBusy(null);
  }

  async function like() {
    setBusy("like");
    setError(null);
    try {
      const result = await likeComment(comment.id);
      setLiked(
        result.platformReactionId
          ? `Liked. Reaction id on the platform: ${result.platformReactionId}`
          : "Liked.",
      );
    } catch (err) {
      setError(`Like failed: ${errorText(err)}`);
    }
    setBusy(null);
  }

  return (
    <article className="rounded-lg border border-border bg-background px-4 py-4">
      <header className="flex flex-wrap items-center gap-2">
        {comment.triageOutcome ? (
          <Badge tone={comment.triageOutcome === "failed" ? "bad" : comment.triageOutcome === "blocked_no_clearance" ? "warn" : "neutral"}>
            {triageWords(comment.triageOutcome)}
          </Badge>
        ) : (
          <Badge tone="neutral">{triageWords("untriaged")}</Badge>
        )}
        <span className="text-xs text-muted">
          {engagementKindWords(comment.kind)} · {accountName(accounts, comment.accountId)} ·{" "}
          {platformWords(comment.platform)} · {formatTime(comment.occurredAt)}
          {comment.triagedAt ? ` · triaged ${formatTime(comment.triagedAt)}` : ""}
        </span>
      </header>

      <p className="mt-3 text-xs font-semibold text-muted">{author} wrote:</p>
      {comment.text === null ? (
        <p className="mt-1 text-sm italic text-muted">Comment text removed after its retention period</p>
      ) : (
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">{comment.text}</p>
      )}

      {comment.triageFailureCode ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span className="font-semibold">Why Triage failed:</span> {failureWords(comment.triageFailureCode)}
        </p>
      ) : null}

      <p className="mt-2 text-xs text-muted">
        Post {comment.platformPostId} · comment {comment.platformCommentId}
      </p>

      {liked ? (
        <p className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{liked}</p>
      ) : null}
      {error ? (
        <div className="mt-3">
          <ErrorNote message={error} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {rerunnable ? (
          <button type="button" onClick={() => void rerun()} disabled={busy !== null} className={secondaryButton}>
            {busy === "rerun" ? "Running again…" : "Run again"}
          </button>
        ) : null}
        <button type="button" onClick={() => void like()} disabled={busy !== null || liked !== null} className={secondaryButton}>
          {busy === "like" ? "Liking…" : liked ? "Liked" : "Like"}
        </button>
      </div>
    </article>
  );
}
