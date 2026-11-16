"use client";

import Link from "next/link";
import { useState } from "react";
import { useHubEvent } from "@/components/SocialHubProvider";
import { useServerRefresh } from "@/lib/hooks/use-server-refresh";
import { Time } from "@/components/Time";
import { Badge, ErrorNote, Notice, quietButton, secondaryButton } from "@/components/ui";
import type { CommentTab } from "@/lib/social/comments";
import { isRerunnable } from "@/lib/social/comments";
import type { SocialAccount, SocialCommentView } from "@/lib/social/types";
import { engagementKindWords, failureWords, platformWords, triageWords } from "@/lib/social/words";
import type { CommentActions } from "@/services/comment-actions";
import { LIST_LIMIT, errorText } from "@/services/social-api";

/**
 * The comments of one Comments tab, as the server read them. This is the interactive part: Run again and Like are
 * Server Actions, and a live message makes the server read the list again (there is no route for one comment, so a
 * change is seen by reading the tab again). The notices from Run again stay until dismissed.
 */
export function CommentsView({
  comments,
  accounts,
  tab,
  actions,
}: {
  comments: SocialCommentView[];
  accounts: SocialAccount[];
  tab: CommentTab;
  /** How a card changes a comment: Server Actions in the app, stand-ins in a test. */
  actions: CommentActions;
}) {
  const [notices, setNotices] = useState<string[]>([]);
  const { refresh } = useServerRefresh();
  useHubEvent("commentChanged", refresh);
  useHubEvent("resync", refresh);

  return (
    <div className="mt-4 flex flex-col gap-3">
      {tab.state === "blocked_no_clearance" ? (
        <Notice tone="info">
          GeekSocial sends a comment to Claude only for a platform named in GEEK_SOCIAL_CLAUDE_CLEARED_PLATFORMS on
          GeekAPI. Until the platform is named there, its comments are held here and nothing is sent. Once it is set,
          press Run again on each comment. The{" "}
          <Link href="/activity" className="font-semibold underline">
            Activity
          </Link>{" "}
          page shows which platforms are cleared now.
        </Notice>
      ) : null}

      {notices.map((text, i) => (
        <Notice key={i} tone="good" onDismiss={() => setNotices((prev) => prev.filter((_, j) => j !== i))}>
          {text}
        </Notice>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
        <button type="button" onClick={refresh} className={quietButton}>
          Reload
        </button>
      </div>
      {comments.length >= LIST_LIMIT ? (
        <Notice tone="warn">
          GeekAPI returns at most {LIST_LIMIT} comments, and it returned that many. Older comments in this state may
          exist and are not shown here.
        </Notice>
      ) : null}
      {comments.length === 0 ? <p className="text-sm text-muted">{tab.empty}</p> : null}
      {comments.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          accountLabel={accounts.find((a) => a.id === comment.accountId)?.displayName ?? `Account ${comment.accountId}`}
          rerunnable={isRerunnable(tab)}
          actions={actions}
          onRerun={(text) => {
            setNotices((prev) => [...prev, text]);
            refresh();
          }}
        />
      ))}
    </div>
  );
}

function CommentCard({
  comment,
  accountLabel,
  rerunnable,
  actions,
  onRerun,
}: {
  comment: SocialCommentView;
  accountLabel: string;
  rerunnable: boolean;
  actions: CommentActions;
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
      const result = await actions.rerun(comment.id);
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
      const result = await actions.like(comment.id);
      setLiked(
        result.platformReactionId ? `Liked. Reaction id on the platform: ${result.platformReactionId}` : "Liked.",
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
          <Badge
            tone={
              comment.triageOutcome === "failed" ? "bad" : comment.triageOutcome === "blocked_no_clearance" ? "warn" : "neutral"
            }
          >
            {triageWords(comment.triageOutcome)}
          </Badge>
        ) : (
          <Badge tone="neutral">{triageWords("untriaged")}</Badge>
        )}
        <span className="text-xs text-muted">
          {engagementKindWords(comment.kind)} · {accountLabel} · {platformWords(comment.platform)} ·{" "}
          <Time value={comment.occurredAt} />
          {comment.triagedAt ? (
            <>
              {" "}· triaged <Time value={comment.triagedAt} />
            </>
          ) : null}
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
