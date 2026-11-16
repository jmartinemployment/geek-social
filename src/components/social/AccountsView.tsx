"use client";

import { startTransition, useActionState, useState } from "react";
import { useHubEvent } from "@/components/SocialHubProvider";
import { useServerRefresh } from "@/lib/hooks/use-server-refresh";
import { Time } from "@/components/Time";
import {
  Badge,
  ErrorNote,
  Notice,
  Panel,
  checkboxClass,
  primaryButton,
  quietButton,
  secondaryButton,
} from "@/components/ui";
import { AUTO_SEND_CATEGORIES, type AutoSendCategory, type ResyncResult, type SocialAccount } from "@/lib/social/types";
import { accountStatusWords, categoryWords, platformWords } from "@/lib/social/words";
import type { AccountActions } from "@/services/account-actions";
import { errorText } from "@/services/social-api";

/** Connect a Facebook Page. The form's action starts the connect on the server and sends the browser to Meta. */
export function ConnectPanel({ actions }: { actions: AccountActions }) {
  const [error, connect, pending] = useActionState(async (): Promise<string | null> => {
    try {
      return await actions.connect();
    } catch (err) {
      return errorText(err);
    }
  }, null);

  return (
    <Panel title="Connect a Facebook Page">
      <p className="text-sm text-muted">
        Sends you to Meta to choose the Pages GeekSocial may manage, then back here. Use it again to reconnect a Page
        whose sign-in the platform refused. The address{" "}
        <code className="rounded bg-surface-muted px-1 text-xs">/connect/meta/callback</code> on this site must be listed
        under Valid OAuth Redirect URIs in the Meta app.
      </p>
      <form action={connect} className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Opening Meta…" : "Connect a Facebook Page"}
        </button>
      </form>
      {error ? (
        <div className="mt-3">
          <ErrorNote message={`Could not start connecting: ${error}`} />
        </div>
      ) : null}
    </Panel>
  );
}

/**
 * The connected accounts, as the server read them. A change on the live connection, or a reconnect of it, makes the
 * server read the list again; saving settings does the same through the action. Nothing here polls.
 */
export function AccountsView({ accounts, actions }: { accounts: SocialAccount[]; actions: AccountActions }) {
  const { refresh } = useServerRefresh();
  useHubEvent("accountChanged", refresh);
  useHubEvent("resync", refresh);

  return (
    <Panel
      title="Connected accounts"
      aside={
        <button type="button" onClick={refresh} className={quietButton}>
          Reload
        </button>
      }
    >
      {accounts.length === 0 ? (
        <p className="text-sm text-muted">No account is connected yet. Connect a Facebook Page above.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} actions={actions} />
          ))}
        </div>
      )}
    </Panel>
  );
}

interface SettingsForm {
  autoSendCategories: AutoSendCategory[];
  sendsDisabled: boolean;
}

interface SaveState {
  error: string | null;
  saved: boolean;
}

type ResyncState = { result: ResyncResult | null; error: string | null };

function isAutoSendCategory(value: string): value is AutoSendCategory {
  return (AUTO_SEND_CATEGORIES as readonly string[]).includes(value);
}

function AccountCard({ account, actions }: { account: SocialAccount; actions: AccountActions }) {
  // Null while untouched: the form then shows what the server holds, including a change the live
  // connection just brought in. Once edited, it holds the person's choices until Save or Discard.
  const [edits, setEdits] = useState<SettingsForm | null>(null);

  const serverForm: SettingsForm = {
    autoSendCategories: account.autoSendCategories.filter(isAutoSendCategory),
    sendsDisabled: account.sendsDisabled,
  };
  const unexpected = account.autoSendCategories.filter((c) => !isAutoSendCategory(c));
  const form = edits ?? serverForm;

  const [saveState, saveAction, saving] = useActionState(async (): Promise<SaveState> => {
    try {
      await actions.save(account.id, form);
    } catch (err) {
      return { error: `Settings were not saved: ${errorText(err)}`, saved: false };
    }
    setEdits(null);
    return { error: null, saved: true };
  }, { error: null, saved: false });

  const [resyncState, resyncAction, resyncing] = useActionState(async (): Promise<ResyncState> => {
    try {
      return { result: await actions.resync(account.id), error: null };
    } catch (err) {
      return { result: null, error: `Resync failed: ${errorText(err)}` };
    }
  }, { result: null, error: null });

  function toggleCategory(category: AutoSendCategory) {
    const has = form.autoSendCategories.includes(category);
    setEdits({
      ...form,
      autoSendCategories: has
        ? form.autoSendCategories.filter((c) => c !== category)
        : AUTO_SEND_CATEGORIES.filter((c) => c === category || form.autoSendCategories.includes(c)),
    });
  }

  return (
    <article className="rounded-lg border border-border bg-background px-4 py-4">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="font-medium text-foreground">{account.displayName}</h3>
        <Badge tone={account.status === "connected" ? "good" : "bad"}>{accountStatusWords(account.status)}</Badge>
        {account.sendsDisabled ? <Badge tone="warn">Sends paused</Badge> : null}
        <span className="text-xs text-muted">
          {platformWords(account.platform)} · id {account.platformAccountId} · connected <Time value={account.connectedAt} />
          {account.tokenExpiresAt ? (
            <>
              {" "}· sign-in expires <Time value={account.tokenExpiresAt} />
            </>
          ) : null}
        </span>
      </header>

      {account.status === "reconnect_required" ? (
        <div className="mt-3">
          <Notice tone="warn">
            The platform refused this account&apos;s sign-in: it expired, was revoked, or lost a permission. Nothing is
            read or sent for it until you connect the Page again above.
          </Notice>
        </div>
      ) : null}

      {/*
        Submitted by a handler inside a transition, not as the form's action: React resets a form after its action runs,
        and that reset would undo the ticked boxes after a refused save, leaving the screen showing a box unticked that
        the next Save would send ticked.
      */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(() => saveAction());
        }}
      >
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <fieldset>
            <legend className="text-sm font-semibold text-foreground">Send without approval</legend>
            <p className="mt-1 text-xs text-muted">
              Replies in a ticked category go out as soon as the Reviewer passes them. Complaints and sensitive comments
              always wait for a person.
            </p>
            {form.autoSendCategories.includes("spam") ? (
              <p className="mt-1 text-xs text-red-600">
                Spam is ticked: every comment sorted as spam gets a public reply with no one reading it first, and that
                reply can draw more attention to the spam.
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-4">
              {AUTO_SEND_CATEGORIES.map((category) => (
                <label key={category} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.autoSendCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    disabled={saving}
                    className={checkboxClass}
                  />
                  {categoryWords(category)}
                </label>
              ))}
            </div>
            {unexpected.length > 0 ? (
              <p className="mt-2 text-xs text-red-600">
                GeekAPI also lists {unexpected.join(", ")} for this account, which this screen does not offer. Saving
                sends only the ticked boxes above.
              </p>
            ) : null}
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-foreground">Pause sends</legend>
            <label className="mt-2 flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.sendsDisabled}
                onChange={(e) => setEdits({ ...form, sendsDisabled: e.target.checked })}
                disabled={saving}
                className={checkboxClass}
              />
              Pause every send from this account
            </label>
            <p className="mt-1 text-xs text-muted">While paused, nothing is sent from this account, approved or automatic.</p>
          </fieldset>
        </div>

        {saveState.error ? (
          <div className="mt-3">
            <ErrorNote message={saveState.error} />
          </div>
        ) : null}
        {saveState.saved && edits === null ? <p className="mt-3 text-sm text-green-700">Settings saved.</p> : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="submit" disabled={saving || edits === null} className={primaryButton}>
            {saving ? "Saving…" : "Save"}
          </button>
          {edits !== null ? (
            <>
              <button type="button" onClick={() => setEdits(null)} disabled={saving} className={secondaryButton}>
                Discard changes
              </button>
              <span className="text-xs text-amber-700">Unsaved changes</span>
            </>
          ) : null}
        </div>
      </form>

      <form action={resyncAction} className="mt-3">
        <button type="submit" disabled={resyncing} className={secondaryButton}>
          {resyncing ? "Resyncing…" : "Resync comments"}
        </button>
      </form>

      {resyncState.result ? (
        <p className="mt-3 text-sm text-foreground">
          Read {resyncState.result.postsRead} {resyncState.result.postsRead === 1 ? "post" : "posts"} and{" "}
          {resyncState.result.commentsRead} {resyncState.result.commentsRead === 1 ? "comment" : "comments"}; stored{" "}
          {resyncState.result.stored} the webhooks had missed.
        </p>
      ) : null}
      {resyncState.error ? (
        <div className="mt-3">
          <ErrorNote message={resyncState.error} />
        </div>
      ) : null}
    </article>
  );
}
