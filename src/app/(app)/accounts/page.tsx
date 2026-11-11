"use client";

import { useState } from "react";
import {
  Badge,
  ErrorNote,
  Loading,
  Notice,
  PageFrame,
  Panel,
  checkboxClass,
  formatTime,
  primaryButton,
  quietButton,
  secondaryButton,
} from "@/components/ui";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { metaRedirectUri } from "@/lib/social/connect";
import {
  AUTO_SEND_CATEGORIES,
  type AutoSendCategory,
  type ResyncResult,
  type SocialAccount,
} from "@/lib/social/types";
import { accountStatusWords, categoryWords, platformWords } from "@/lib/social/words";
import { errorText, resyncAccount, saveAccountSettings, startMetaConnect } from "@/services/social-api";

/** Connected accounts: connect a Facebook Page, set auto-send and the send pause, and resync. */
export default function AccountsPage() {
  const accounts = useAccounts();

  return (
    <PageFrame
      title="Accounts"
      intro="The Pages GeekSocial watches and replies from. Settings change only when you press Save."
    >
      <ConnectPanel />

      <Panel
        title="Connected accounts"
        aside={
          <>
            {accounts.refreshing ? <span className="text-sm text-muted">Refreshing…</span> : null}
            <button type="button" onClick={accounts.reload} className={quietButton}>
              Reload
            </button>
          </>
        }
      >
        {accounts.loading ? <Loading what="accounts" /> : null}
        {accounts.error ? (
          <ErrorNote message={`Accounts did not load: ${accounts.error}`} onRetry={accounts.reload} />
        ) : null}
        {accounts.data ? (
          accounts.data.length === 0 ? (
            <p className="text-sm text-muted">No account is connected yet. Connect a Facebook Page above.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {accounts.data.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onSaved={(saved) =>
                    accounts.setData((list) => list.map((a) => (a.id === saved.id ? saved : a)))
                  }
                />
              ))}
            </div>
          )
        ) : null}
      </Panel>
    </PageFrame>
  );
}

function ConnectPanel() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const { authorizationUrl } = await startMetaConnect(metaRedirectUri());
      window.location.assign(authorizationUrl);
    } catch (err) {
      setError(`Could not start connecting: ${errorText(err)}`);
      setBusy(false);
    }
  }

  return (
    <Panel title="Connect a Facebook Page">
      <p className="text-sm text-muted">
        Sends you to Meta to choose the Pages GeekSocial may manage, then back here. Use it again to
        reconnect a Page whose sign-in the platform refused. The address{" "}
        <code className="rounded bg-surface-muted px-1 text-xs">/connect/meta/callback</code> on this
        site must be listed under Valid OAuth Redirect URIs in the Meta app.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void connect()} disabled={busy} className={primaryButton}>
          {busy ? "Opening Meta…" : "Connect a Facebook Page"}
        </button>
      </div>
      {error ? (
        <div className="mt-3">
          <ErrorNote message={error} />
        </div>
      ) : null}
    </Panel>
  );
}

interface SettingsForm {
  autoSendCategories: AutoSendCategory[];
  sendsDisabled: boolean;
}

function isAutoSendCategory(value: string): value is AutoSendCategory {
  return (AUTO_SEND_CATEGORIES as readonly string[]).includes(value);
}

function AccountCard({
  account,
  onSaved,
}: {
  account: SocialAccount;
  onSaved: (account: SocialAccount) => void;
}) {
  // Null while untouched: the form then shows what the server holds, including a change the live
  // connection just brought in. Once edited, it holds the operator's choices until Save or Discard.
  const [edits, setEdits] = useState<SettingsForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [resyncing, setResyncing] = useState(false);
  const [resyncError, setResyncError] = useState<string | null>(null);
  const [resyncResult, setResyncResult] = useState<ResyncResult | null>(null);

  const serverForm: SettingsForm = {
    autoSendCategories: account.autoSendCategories.filter(isAutoSendCategory),
    sendsDisabled: account.sendsDisabled,
  };
  const unexpected = account.autoSendCategories.filter((c) => !isAutoSendCategory(c));
  const form = edits ?? serverForm;

  function edit(next: SettingsForm) {
    setEdits(next);
    setSaved(false);
  }

  function toggleCategory(category: AutoSendCategory) {
    const has = form.autoSendCategories.includes(category);
    edit({
      ...form,
      autoSendCategories: has
        ? form.autoSendCategories.filter((c) => c !== category)
        : AUTO_SEND_CATEGORIES.filter((c) => c === category || form.autoSendCategories.includes(c)),
    });
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveAccountSettings(account.id, form);
      onSaved(result);
      setEdits(null);
      setSaved(true);
    } catch (err) {
      setSaveError(`Settings were not saved: ${errorText(err)}`);
    }
    setSaving(false);
  }

  async function resync() {
    setResyncing(true);
    setResyncError(null);
    setResyncResult(null);
    try {
      setResyncResult(await resyncAccount(account.id));
    } catch (err) {
      setResyncError(`Resync failed: ${errorText(err)}`);
    }
    setResyncing(false);
  }

  return (
    <article className="rounded-lg border border-border bg-background px-4 py-4">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="font-medium text-foreground">{account.displayName}</h3>
        <Badge tone={account.status === "connected" ? "good" : "bad"}>{accountStatusWords(account.status)}</Badge>
        {account.sendsDisabled ? <Badge tone="warn">Sends paused</Badge> : null}
        <span className="text-xs text-muted">
          {platformWords(account.platform)} · id {account.platformAccountId} · connected{" "}
          {formatTime(account.connectedAt)}
          {account.tokenExpiresAt ? ` · sign-in expires ${formatTime(account.tokenExpiresAt)}` : ""}
        </span>
      </header>

      {account.status === "reconnect_required" ? (
        <div className="mt-3">
          <Notice tone="warn">
            The platform refused this account&apos;s sign-in: it expired, was revoked, or lost a
            permission. Nothing is read or sent for it until you connect the Page again above.
          </Notice>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-semibold text-foreground">Send without approval</legend>
          <p className="mt-1 text-xs text-muted">
            Replies in a ticked category go out as soon as the Reviewer passes them. Complaints and
            sensitive comments always wait for a person.
          </p>
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
              GeekAPI also lists {unexpected.join(", ")} for this account, which this screen does not
              offer. Saving sends only the ticked boxes above.
            </p>
          ) : null}
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-foreground">Pause sends</legend>
          <label className="mt-2 flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.sendsDisabled}
              onChange={(e) => edit({ ...form, sendsDisabled: e.target.checked })}
              disabled={saving}
              className={checkboxClass}
            />
            Pause every send from this account
          </label>
          <p className="mt-1 text-xs text-muted">
            While paused, nothing is sent from this account, approved or automatic.
          </p>
        </fieldset>
      </div>

      {saveError ? (
        <div className="mt-3">
          <ErrorNote message={saveError} />
        </div>
      ) : null}
      {saved ? <p className="mt-3 text-sm text-green-700">Settings saved.</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void save()} disabled={saving || edits === null} className={primaryButton}>
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
        <span className="mx-2 hidden h-5 w-px bg-border sm:inline-block" aria-hidden="true" />
        <button type="button" onClick={() => void resync()} disabled={resyncing} className={secondaryButton}>
          {resyncing ? "Resyncing…" : "Resync comments"}
        </button>
      </div>

      {resyncResult ? (
        <p className="mt-3 text-sm text-foreground">
          Read {resyncResult.postsRead} {resyncResult.postsRead === 1 ? "post" : "posts"} and{" "}
          {resyncResult.commentsRead} {resyncResult.commentsRead === 1 ? "comment" : "comments"}; stored{" "}
          {resyncResult.stored} the webhooks had missed.
        </p>
      ) : null}
      {resyncError ? (
        <div className="mt-3">
          <ErrorNote message={resyncError} />
        </div>
      ) : null}
    </article>
  );
}
