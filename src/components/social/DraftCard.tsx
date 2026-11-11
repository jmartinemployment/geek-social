"use client";

import { useState } from "react";
import {
  Badge,
  ErrorNote,
  formatTime,
  inputClass,
  primaryButton,
  secondaryButton,
} from "@/components/ui";
import type { ReplyDraft, SendOutcome } from "@/lib/social/types";
import {
  categoryWords,
  draftStatusWords,
  failureWords,
  platformWords,
  ruleWords,
} from "@/lib/social/words";
import {
  SocialApiError,
  approveDraft,
  errorText,
  getDraft,
  rejectDraft,
  saveDraftText,
  sendDraft,
} from "@/services/social-api";

const STATUS_TONE: Record<string, "neutral" | "good" | "warn" | "bad" | "brand"> = {
  pending: "brand",
  approved: "warn",
  sending: "warn",
  sent: "good",
  rejected: "neutral",
  failed: "bad",
};

const CATEGORY_TONE: Record<string, "neutral" | "good" | "warn" | "bad" | "brand"> = {
  question: "neutral",
  praise: "good",
  complaint: "warn",
  spam: "neutral",
  sensitive: "bad",
};

type Busy = "save" | "approve" | "send" | "reject" | null;

/**
 * One reply draft and what can be done with it.
 *
 * The edit box is saved only by its Save button: nothing here saves on typing, on blur or in the
 * background. After any action the draft is read again from GeekAPI and handed up, so the card
 * shows what the server holds rather than what this screen expected.
 */
export function DraftCard({
  draft,
  accountLabel,
  onChanged,
}: {
  draft: ReplyDraft;
  accountLabel: string;
  onChanged: (draft: ReplyDraft) => void;
}) {
  const [editText, setEditText] = useState<string | null>(null);
  const [violations, setViolations] = useState<string[]>([]);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<SendOutcome | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);

  const editing = editText !== null;
  const pending = draft.status === "pending";
  const comment = draft.comment;

  async function readBack(done: string) {
    try {
      onChanged(await getDraft(draft.id));
    } catch (err) {
      setError(`${done}, but reading the draft back failed: ${errorText(err)}`);
    }
  }

  async function save() {
    if (editText === null) return;
    setBusy("save");
    setError(null);
    setViolations([]);
    try {
      await saveDraftText(draft.id, editText);
    } catch (err) {
      if (err instanceof SocialApiError && err.code === "review_refused") {
        setViolations(err.violations);
      }
      setError(errorText(err));
      setBusy(null);
      return;
    }
    setEditText(null);
    await readBack("Saved");
    setBusy(null);
  }

  async function approve() {
    setBusy("approve");
    setError(null);
    setOutcome(null);
    try {
      const result = await approveDraft(draft.id);
      setOutcome(result.send);
      onChanged(result.draft);
    } catch (err) {
      if (err instanceof SocialApiError && err.code === "review_refused") {
        setViolations(err.violations);
      }
      setError(errorText(err));
    }
    setBusy(null);
  }

  async function sendHeld() {
    setBusy("send");
    setError(null);
    setOutcome(null);
    let result: SendOutcome;
    try {
      result = await sendDraft(draft.id);
    } catch (err) {
      setError(errorText(err));
      setBusy(null);
      return;
    }
    setOutcome(result);
    await readBack("The send was answered");
    setBusy(null);
  }

  async function reject() {
    setBusy("reject");
    setError(null);
    try {
      await rejectDraft(draft.id);
    } catch (err) {
      setError(errorText(err));
      setBusy(null);
      return;
    }
    setConfirmReject(false);
    await readBack("Rejected");
    setBusy(null);
  }

  return (
    <article className="rounded-lg border border-border bg-background px-4 py-4">
      <header className="flex flex-wrap items-center gap-2">
        <Badge tone={CATEGORY_TONE[draft.category] ?? "neutral"}>{categoryWords(draft.category)}</Badge>
        <Badge tone={STATUS_TONE[draft.status] ?? "neutral"}>{draftStatusWords(draft.status)}</Badge>
        <span className="text-xs text-muted">
          {accountLabel} · {platformWords(draft.platform)} · drafted {formatTime(draft.createdAt)}
          {draft.decidedAt ? ` · decided ${formatTime(draft.decidedAt)}` : ""}
        </span>
      </header>

      <div className="mt-3 rounded-md border border-border bg-surface px-3 py-2">
        <p className="text-xs font-semibold text-muted">
          {comment.authorDisplayName ?? "Commenter name removed after its retention period"} wrote,{" "}
          {formatTime(comment.occurredAt)}:
        </p>
        {comment.text === null ? (
          <p className="mt-1 text-sm italic text-muted">Comment text removed after its retention period</p>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">{comment.text}</p>
        )}
      </div>

      {draft.needsHumanReason !== null ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span className="font-semibold">A person must write this reply:</span> {draft.needsHumanReason}
        </p>
      ) : null}

      {draft.reviewRefusal && draft.reviewRefusal.length > 0 ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p className="font-semibold">The Reviewer refused this draft:</p>
          <ul className="mt-1 list-disc pl-5">
            {draft.reviewRefusal.map((rule) => (
              <li key={rule}>{ruleWords(rule)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {draft.failureCode ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span className="font-semibold">Send failed:</span> {failureWords(draft.failureCode)}
        </p>
      ) : null}

      <div className="mt-3">
        <p className="text-xs font-semibold text-muted">Reply</p>
        {editing ? (
          <div className="mt-1 flex flex-col gap-2 lg:flex-row lg:items-start">
            <div className="flex-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={5}
                className={inputClass}
                aria-label="Reply text"
              />
              <p className="mt-1 text-xs text-muted">
                {editText.length} characters. Not saved until you press Save.
              </p>
            </div>
            {violations.length > 0 ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 lg:w-80">
                <p className="font-semibold">The Reviewer refused this text. Nothing was saved.</p>
                <ul className="mt-1 list-disc pl-5">
                  {violations.map((rule) => (
                    <li key={rule}>{ruleWords(rule)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : draft.draftText ? (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">{draft.draftText}</p>
        ) : (
          <p className="mt-1 text-sm italic text-muted">No reply text yet.</p>
        )}
        {!editing && violations.length > 0 ? (
          <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <p className="font-semibold">The Reviewer refused this text. Nothing was sent.</p>
            <ul className="mt-1 list-disc pl-5">
              {violations.map((rule) => (
                <li key={rule}>{ruleWords(rule)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {draft.status === "sent" && draft.sentPlatformCommentId ? (
        <p className="mt-2 text-xs text-muted">Reply id on the platform: {draft.sentPlatformCommentId}</p>
      ) : null}
      {draft.status === "sending" && draft.sendingStartedAt ? (
        <p className="mt-2 text-xs text-muted">Sending since {formatTime(draft.sendingStartedAt)}</p>
      ) : null}

      {outcome ? <SendOutcomeNote outcome={outcome} /> : null}
      {error ? (
        <div className="mt-3">
          <ErrorNote message={error} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {pending && editing ? (
          <>
            <button type="button" onClick={() => void save()} disabled={busy !== null} className={primaryButton}>
              {busy === "save" ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditText(null);
                setViolations([]);
                setError(null);
              }}
              disabled={busy !== null}
              className={secondaryButton}
            >
              Cancel edit
            </button>
          </>
        ) : null}

        {pending && !editing ? (
          <>
            <button
              type="button"
              onClick={() => void approve()}
              disabled={busy !== null || draft.draftText.trim().length === 0}
              title={draft.draftText.trim().length === 0 ? "Write the reply with Edit first" : undefined}
              className={primaryButton}
            >
              {busy === "approve" ? "Approving and sending…" : "Approve and send"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditText(draft.draftText);
                setViolations([]);
                setError(null);
              }}
              disabled={busy !== null}
              className={secondaryButton}
            >
              Edit
            </button>
          </>
        ) : null}

        {draft.status === "approved" ? (
          <button type="button" onClick={() => void sendHeld()} disabled={busy !== null} className={primaryButton}>
            {busy === "send" ? "Sending…" : "Send"}
          </button>
        ) : null}

        {(pending || draft.status === "approved") && !editing ? (
          confirmReject ? (
            <>
              <button
                type="button"
                onClick={() => void reject()}
                disabled={busy !== null}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy === "reject" ? "Rejecting…" : "Reject for good?"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmReject(false)}
                disabled={busy !== null}
                className={secondaryButton}
              >
                Keep it
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReject(true)}
              disabled={busy !== null}
              className={secondaryButton}
            >
              Reject
            </button>
          )
        ) : null}
      </div>
    </article>
  );
}

function SendOutcomeNote({ outcome }: { outcome: SendOutcome }) {
  if (outcome.sent) {
    return (
      <p className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
        Sent.
      </p>
    );
  }
  if (outcome.held) {
    return (
      <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <span className="font-semibold">Approved and held back by a send limit.</span>{" "}
        {outcome.retryAfter
          ? `It goes out at the next wake after ${formatTime(outcome.retryAfter)}, or press Send then.`
          : "It goes out at the next wake, or press Send."}
        {outcome.code ? ` (${failureWords(outcome.code)})` : ""}
        {outcome.error ? ` ${outcome.error}` : ""}
      </p>
    );
  }
  return (
    <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <p className="font-semibold">Not sent.</p>
      {outcome.code ? <p>{failureWords(outcome.code)}</p> : null}
      {outcome.error ? <p>{outcome.error}</p> : null}
      {!outcome.code && !outcome.error ? (
        <p>GeekAPI answered that the reply was neither sent nor held, and gave no code or reason.</p>
      ) : null}
    </div>
  );
}
