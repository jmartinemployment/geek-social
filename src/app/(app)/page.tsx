"use client";

import { useState } from "react";
import { AccountFilter } from "@/components/AccountFilter";
import { useHubEvent } from "@/components/SocialHubProvider";
import { DraftCard } from "@/components/social/DraftCard";
import { ErrorNote, Loading, Notice, PageFrame, Panel, Tabs, quietButton } from "@/components/ui";
import { accountName, useAccounts } from "@/lib/hooks/use-accounts";
import { useResource } from "@/lib/hooks/use-resource";
import { INBOX_TABS, inboxTab, newestFirst, placeDraft, type InboxTabId } from "@/lib/social/inbox";
import type { DraftChangedMessage, ReplyDraft } from "@/lib/social/types";
import { LIST_LIMIT, errorText, getDraft, listDrafts } from "@/services/social-api";

interface InboxList {
  drafts: ReplyDraft[];
  /** A status read came back full, so older drafts may exist beyond what is shown. */
  truncated: boolean;
}

/** The Inbox: reply drafts by status, with approve, edit, send and reject. */
export default function InboxPage() {
  const [tabId, setTabId] = useState<InboxTabId>("pending");
  const [accountId, setAccountId] = useState<string | null>(null);
  // Drafts the operator acted on in this tab. They stay in view after they leave the tab's status,
  // so the outcome of the action is not taken away by the live message it causes.
  const [kept, setKept] = useState<ReadonlySet<string>>(new Set());
  const [liveErrors, setLiveErrors] = useState<string[]>([]);

  const accounts = useAccounts();
  const tab = inboxTab(tabId);

  const list = useResource<InboxList>(`${tabId}|${accountId ?? ""}`, async () => {
    const reads = await Promise.all(tab.statuses.map((status) => listDrafts(status, accountId)));
    return {
      drafts: reads.flat().filter(tab.matches).sort(newestFirst),
      truncated: reads.some((r) => r.length >= LIST_LIMIT),
    };
  });

  useHubEvent("draftChanged", (body) => {
    const message = body as DraftChangedMessage;
    if (accountId && message.accountId !== accountId) return;
    void (async () => {
      let draft: ReplyDraft;
      try {
        draft = await getDraft(message.draftId);
      } catch (err) {
        setLiveErrors((prev) => [
          ...prev,
          `A draft changed (${message.draftId}, now ${message.status}) and reading it failed: ${errorText(err)}`,
        ]);
        return;
      }
      list.setData((current) => ({ ...current, drafts: placeDraft(current.drafts, draft, tab, kept) }));
    })();
  });
  useHubEvent("resync", () => list.reload());

  function selectTab(id: InboxTabId) {
    setTabId(id);
    setKept(new Set());
  }

  function handleChanged(draft: ReplyDraft) {
    const nextKept = new Set(kept).add(draft.id);
    setKept(nextKept);
    list.setData((current) => ({ ...current, drafts: placeDraft(current.drafts, draft, tab, nextKept) }));
  }

  return (
    <PageFrame
      title="Inbox"
      intro="Replies Claude drafted for comments on your connected Pages. Nothing is sent until you approve it, unless the account auto-sends that category."
    >
      <Panel
        aside={
          <AccountFilter
            accounts={accounts.data}
            accountsError={accounts.error}
            value={accountId}
            onChange={(id) => {
              setAccountId(id);
              setKept(new Set());
            }}
          />
        }
      >
        <Tabs label="Draft status" tabs={INBOX_TABS} selected={tabId} onSelect={selectTab} />

        <div className="mt-4 flex flex-col gap-3">
          {liveErrors.length > 0 ? (
            <div className="flex flex-col gap-2">
              {liveErrors.map((message, i) => (
                <ErrorNote key={i} message={message} />
              ))}
              <button type="button" onClick={() => setLiveErrors([])} className={`${quietButton} self-start`}>
                Clear these errors
              </button>
            </div>
          ) : null}

          {list.loading ? <Loading what="drafts" /> : null}
          {list.error ? <ErrorNote message={`Drafts did not load: ${list.error}`} onRetry={list.reload} /> : null}

          {list.data ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                <span>
                  {list.data.drafts.length} {list.data.drafts.length === 1 ? "draft" : "drafts"}
                  {list.refreshing ? " · refreshing…" : ""}
                </span>
                <button type="button" onClick={list.reload} className={quietButton}>
                  Reload
                </button>
              </div>
              {list.data.truncated ? (
                <Notice tone="warn">
                  GeekAPI returns at most {LIST_LIMIT} drafts per status, and it returned that many. Older
                  drafts with this status may exist and are not shown here.
                </Notice>
              ) : null}
              {list.data.drafts.length === 0 ? <p className="text-sm text-muted">{tab.empty}</p> : null}
              {list.data.drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  accountLabel={accountName(accounts.data, draft.accountId)}
                  onChanged={handleChanged}
                />
              ))}
            </>
          ) : null}
        </div>
      </Panel>
    </PageFrame>
  );
}
