"use client";

import { useState } from "react";
import { AccountFilter } from "@/components/AccountFilter";
import {
  ErrorNote,
  Loading,
  Notice,
  PageFrame,
  Panel,
  formatTime,
  inputClass,
  labelClass,
  primaryButton,
  quietButton,
  secondaryButton,
} from "@/components/ui";
import { accountName, useAccounts } from "@/lib/hooks/use-accounts";
import { useResource } from "@/lib/hooks/use-resource";
import type { LinkPost, SocialAccount, StoredPost } from "@/lib/social/types";
import { platformWords, ruleWords } from "@/lib/social/words";
import {
  LIST_LIMIT,
  SocialApiError,
  errorText,
  listPosts,
  publishPost,
  suggestPostCopy,
} from "@/services/social-api";

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

/** Publish a link post: the Post Writer suggests copy, a person edits it, then it is published once. */
export default function PostsPage() {
  const accounts = useAccounts();
  const [filterAccountId, setFilterAccountId] = useState<string | null>(null);
  const posts = useResource<StoredPost[]>(`posts|${filterAccountId ?? ""}`, () => listPosts(filterAccountId));

  return (
    <PageFrame
      title="Posts"
      intro="Share an article as a link post. Suggest copy writes a first version; nothing is posted until you press Publish."
    >
      <PostWriter accounts={accounts.data} accountsError={accounts.error} onPublished={posts.reload} />

      <Panel
        title="Published posts"
        aside={
          <>
            <AccountFilter
              accounts={accounts.data}
              accountsError={null}
              value={filterAccountId}
              onChange={setFilterAccountId}
            />
            <button type="button" onClick={posts.reload} className={quietButton}>
              Reload
            </button>
          </>
        }
      >
        {posts.loading ? <Loading what="posts" /> : null}
        {posts.error ? <ErrorNote message={`Posts did not load: ${posts.error}`} onRetry={posts.reload} /> : null}
        {posts.data ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              {posts.data.length} {posts.data.length === 1 ? "post" : "posts"}
              {posts.refreshing ? " · refreshing…" : ""}
            </p>
            {posts.data.length >= LIST_LIMIT ? (
              <Notice tone="warn">
                GeekAPI returns at most {LIST_LIMIT} posts, and it returned that many. Older posts may
                exist and are not shown here.
              </Notice>
            ) : null}
            {posts.data.length === 0 ? <p className="text-sm text-muted">No posts have been published.</p> : null}
            {posts.data.map((post) => (
              <article key={post.id} className="rounded-lg border border-border bg-background px-4 py-3">
                <p className="text-xs text-muted">
                  {accountName(accounts.data, post.accountId)} · {platformWords(post.platform)} ·{" "}
                  {post.publishedAt
                    ? `published ${formatTime(post.publishedAt)}`
                    : post.scheduledFor
                      ? `scheduled for ${formatTime(post.scheduledFor)}`
                      : `stored ${formatTime(post.createdAt)}, not published yet`}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">{post.text}</p>
                {post.linkUrl ? (
                  <a
                    href={post.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block break-all text-sm text-[#C83803] hover:underline"
                  >
                    {post.linkUrl}
                  </a>
                ) : null}
                <p className="mt-1 text-xs text-muted">Post id on the platform: {post.platformPostId}</p>
              </article>
            ))}
          </div>
        ) : null}
      </Panel>
    </PageFrame>
  );
}

function PostWriter({
  accounts,
  accountsError,
  onPublished,
}: {
  accounts: SocialAccount[] | null;
  accountsError: string | null;
  onPublished: () => void;
}) {
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);
  const [busy, setBusy] = useState<"suggest" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [violations, setViolations] = useState<string[]>([]);
  const [published, setPublished] = useState<string | null>(null);

  const account = accounts?.find((a) => a.id === form.accountId) ?? null;
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
      const result = await suggestPostCopy({
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
      const stored = await publishPost(account.id, post);
      setPublished(`Published to ${account.displayName}. Post id on the platform: ${stored.platformPostId}`);
      setForm({ ...EMPTY_FORM, accountId: form.accountId });
      onPublished();
    } catch (err) {
      if (err instanceof SocialApiError && err.code === "review_refused") {
        setViolations(err.violations);
      }
      setError(`Not published: ${errorText(err)}`);
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
            {(accounts ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName} ({platformWords(a.platform)})
              </option>
            ))}
          </select>
          {accountsError ? (
            <span className="text-xs font-normal text-red-600">Accounts did not load: {accountsError}</span>
          ) : null}
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
      {published ? (
        <div className="mt-4">
          <Notice tone="good" onDismiss={() => setPublished(null)}>
            {published}
          </Notice>
        </div>
      ) : null}

      <div className="mt-4">
        <button type="button" onClick={() => void publish()} disabled={busy !== null || !canPublish} className={primaryButton}>
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
