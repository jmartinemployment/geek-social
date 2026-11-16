"use client";

import { useState } from "react";
import { useHubEvent } from "@/components/SocialHubProvider";
import { useServerRefresh } from "@/lib/hooks/use-server-refresh";
import { DraftCard } from "@/components/social/DraftCard";
import { Notice, quietButton } from "@/components/ui";
import { LIST_LIMIT } from "@/services/social-api";
import type { DraftActions } from "@/services/draft-actions";
import type { ReplyDraft, SocialAccount } from "@/lib/social/types";

/**
 * The drafts of one Inbox tab, as the server read them. The list itself is server-rendered data; this is the
 * interactive part. A draft the person acts on here stays in view with its new state even after it no longer
 * belongs to the tab, so the outcome of their own action is not taken away by the page refreshing. When the server
 * sends a newer list, what it holds replaces what this screen had; only drafts the person acted on that the new list
 * no longer contains are kept. A live message makes the server read the list again.
 */
export function InboxView({
  drafts,
  accounts,
  emptyText,
  truncated,
  actions,
}: {
  drafts: ReplyDraft[];
  accounts: SocialAccount[];
  emptyText: string;
  truncated: boolean;
  /** How a card changes a draft: Server Actions in the app, stand-ins in a test. */
  actions: DraftActions;
}) {
  const [state, setState] = useState<{ base: ReplyDraft[]; acted: ReadonlyMap<string, ReplyDraft> }>({
    base: drafts,
    acted: new Map(),
  });

  // The server sent a new list: it is fresher than anything held here, so it wins for every draft it contains.
  if (state.base !== drafts) {
    const inList = new Set(drafts.map((d) => d.id));
    setState({ base: drafts, acted: new Map([...state.acted].filter(([id]) => !inList.has(id))) });
  }

  const shown = [
    ...drafts.map((d) => state.acted.get(d.id) ?? d),
    ...[...state.acted.values()].filter((d) => !drafts.some((s) => s.id === d.id)),
  ];

  const { refresh } = useServerRefresh();
  useHubEvent("draftChanged", refresh);
  useHubEvent("resync", refresh);

  /** An explicit Reload shows exactly what the server holds: drafts acted on here stop being kept in view. */
  function reload() {
    setState((current) => ({ ...current, acted: new Map() }));
    refresh();
  }

  function changed(draft: ReplyDraft) {
    setState((current) => ({ ...current, acted: new Map(current.acted).set(draft.id, draft) }));
  }

  const name = (accountId: string) => accounts.find((a) => a.id === accountId)?.displayName ?? `Account ${accountId}`;

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>
          {shown.length} {shown.length === 1 ? "draft" : "drafts"}
        </span>
        <button type="button" onClick={reload} className={quietButton}>
          Reload
        </button>
      </div>
      {truncated ? (
        <Notice tone="warn">
          GeekAPI returns at most {LIST_LIMIT} drafts per status, and it returned that many. Older drafts with this status may
          exist and are not shown here.
        </Notice>
      ) : null}
      {shown.length === 0 ? <p className="text-sm text-muted">{emptyText}</p> : null}
      {shown.map((draft) => (
        <DraftCard key={draft.id} draft={draft} accountLabel={name(draft.accountId)} onChanged={changed} actions={actions} />
      ))}
    </div>
  );
}
