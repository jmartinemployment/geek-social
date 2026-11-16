"use client";

import { useState } from "react";
import { ErrorNote, Notice, Panel, inputClass, labelClass, primaryButton, quietButton, secondaryButton } from "@/components/ui";
import { useServerRefresh } from "@/lib/hooks/use-server-refresh";
import { mayHaveHappened } from "@/lib/social/outcome";
import type { LinkPost, SocialAccount } from "@/lib/social/types";
import { platformWords, ruleWords } from "@/lib/social/words";
import type { PostActions } from "@/services/post-actions";
import { SocialApiError, errorText } from "@/services/social-api";

interface PostForm {
  accountId: string;
  articleUrl: string;
  articleTitle: string;
  articleSummary: string;
  imageUrl: string;
  text: string;
  linkTitle: string;
  linkDescription: string;
}

const EMPTY_FORM: PostForm = {
  accountId: "",
  articleUrl: "",
  articleTitle: "",
  articleSummary: "",
  imageUrl: "",
  text: "",
  linkTitle: "",
  linkDescription: "",
};

const orNull = (value: string) => (value.trim() === "" ? null : value.trim());

/**
 * The new-post form: the Post Writer suggests copy, a person edits it, then it is published once. The fields are this
 * form's own state until Publish; a publish that gets no clear answer keeps Publish off until the person has looked at
 * the Page.
 */
export function PostWriter({ accounts, actions }: { accounts: SocialAccount[]; actions: PostActions }) {
  // The server reads the published list again, so a post that went out shows up.
  const { refresh: onPublished } = useServerRefresh();
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);
  const [busy, setBusy] = useState<"suggest" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [violations, setViolations] = useState<string[]>([]);
  const [published, setPublished] = useState<string | null>(null);
  // Set when a publish got no clear answer: the post may be live, so Publish stays off until the
  // operator has looked at the Page.
  const [uncertain, setUncertain] = useState<string | null>(null);

  const account = accounts.find((a) => a.id === form.accountId) ?? null;
  const set = (field: keyof PostForm) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function suggest() {
    if (!account) {
      setError("Choose the account the post is for first.");
      return;
    }
    setBusy("suggest");
    setError(null);
    setViolations([]);
    setPublished(null);
    try {
      const result = await actions.suggestCopy({
        articleUrl: form.articleUrl.trim(),
        articleTitle: form.articleTitle.trim(),
        articleSummary: form.articleSummary.trim(),
        platforms: [account.platform],
        imageUrl: orNull(form.imageUrl),
      });
      const copy = result.copies.find((c) => c.platform === account.platform);
      if (!copy) {
        setError(
          `The Post Writer returned no copy for ${platformWords(account.platform)}${
            result.copies.length > 0
              ? ` (it returned copy for ${result.copies.map((c) => platformWords(c.platform)).join(", ")})`
              : ""
          }.`,
        );
      } else {
        setForm((f) => ({
          ...f,
          text: copy.post.text,
          linkTitle: copy.post.linkTitle ?? "",
          linkDescription: copy.post.linkDescription ?? "",
        }));
      }
    } catch (err) {
      setError(`Suggest copy failed: ${errorText(err)}`);
    }
    setBusy(null);
  }

  async function publish() {
    if (!account) {
      setError("Choose the account to publish from first.");
      return;
    }
    setBusy("publish");
    setError(null);
    setViolations([]);
    setPublished(null);
    const post: LinkPost = {
      kind: "link",
      text: form.text,
      linkUrl: form.articleUrl.trim(),
      linkTitle: orNull(form.linkTitle),
      linkDescription: orNull(form.linkDescription),
      imageUrl: orNull(form.imageUrl),
      scheduledFor: null,
    };
    try {
      const stored = await actions.publish(account.id, post);
      setPublished(`Published to ${account.displayName}. Post id on the platform: ${stored.platformPostId}`);
      setForm({ ...EMPTY_FORM, accountId: form.accountId });
      onPublished();
    } catch (err) {
      if (err instanceof SocialApiError && err.code === "review_refused") {
        setViolations(err.violations);
      }
      if (mayHaveHappened(err)) {
        setUncertain(`The post may have been published. ${errorText(err)}`);
        // The list is read again so a post that did go out shows up.
        onPublished();
      } else {
        setError(`Not published: ${errorText(err)}`);
      }
    }
    setBusy(null);
  }

  const canSuggest =
    account !== null &&
    form.articleUrl.trim() !== "" &&
    form.articleTitle.trim() !== "" &&
    form.articleSummary.trim() !== "";
  const canPublish = account !== null && form.articleUrl.trim() !== "" && form.text.trim() !== "";

  return (
    <Panel title="New link post">
      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClass}>
          Account
          <select value={form.accountId} onChange={set("accountId")} className={inputClass} disabled={busy !== null}>
            <option value="">Choose an account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName} ({platformWords(a.platform)})
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Article URL
          <input type="url" value={form.articleUrl} onChange={set("articleUrl")} className={inputClass} placeholder="https://geekatyourspot.com/..." />
        </label>
        <label className={labelClass}>
          Title
          <input value={form.articleTitle} onChange={set("articleTitle")} className={inputClass} />
        </label>
        <label className={labelClass}>
          Image URL <span className="text-xs font-normal text-muted">(optional)</span>
          <input type="url" value={form.imageUrl} onChange={set("imageUrl")} className={inputClass} />
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          Summary
          <textarea value={form.articleSummary} onChange={set("articleSummary")} rows={3} className={inputClass} />
        </label>
      </div>

      <div className="mt-4">
        <button type="button" onClick={() => void suggest()} disabled={busy !== null || !canSuggest} className={secondaryButton}>
          {busy === "suggest" ? "Suggesting…" : "Suggest copy"}
        </button>
        {!canSuggest ? (
          <span className="ml-3 text-xs text-muted">Needs an account, the article URL, title and summary.</span>
        ) : null}
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
          <label className={`${labelClass} flex-1`}>
            Post text
            <textarea value={form.text} onChange={set("text")} rows={7} className={inputClass} />
            <span className="text-xs font-normal text-muted">{form.text.length} characters</span>
          </label>
          {violations.length > 0 ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 lg:mt-6 lg:w-80">
              <p className="font-semibold">The Reviewer refused this text. Nothing was posted.</p>
              <ul className="mt-1 list-disc pl-5">
                {violations.map((rule) => (
                  <li key={rule}>{ruleWords(rule)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Link title <span className="text-xs font-normal text-muted">(optional)</span>
            <input value={form.linkTitle} onChange={set("linkTitle")} className={inputClass} />
          </label>
          <label className={labelClass}>
            Link description <span className="text-xs font-normal text-muted">(optional)</span>
            <input value={form.linkDescription} onChange={set("linkDescription")} className={inputClass} />
          </label>
        </div>
      </div>

      {error ? (
        <div className="mt-4">
          <ErrorNote message={error} />
        </div>
      ) : null}
      {uncertain ? (
        <div className="mt-4">
          <Notice tone="warn">
            <p className="font-semibold">Publishing did not get a clear answer.</p>
            <p>{uncertain}</p>
            <p>
              Check the Page and the Published posts list below. Publishing again could post it twice.
            </p>
            <button type="button" onClick={() => setUncertain(null)} className={`${quietButton} mt-2`}>
              I checked the Page: allow Publish again
            </button>
          </Notice>
        </div>
      ) : null}
      {published ? (
        <div className="mt-4">
          <Notice tone="good" onDismiss={() => setPublished(null)}>
            {published}
          </Notice>
        </div>
      ) : null}

      <div className="mt-4">
        <button type="button" onClick={() => void publish()} disabled={busy !== null || !canPublish || uncertain !== null} className={primaryButton}>
          {busy === "publish" ? "Publishing…" : "Publish"}
        </button>
        {account ? (
          <span className="ml-3 text-xs text-muted">
            Publishes once, now, to {account.displayName} on {platformWords(account.platform)}.
          </span>
        ) : null}
      </div>
    </Panel>
  );
}
