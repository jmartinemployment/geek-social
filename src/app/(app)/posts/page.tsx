import { Suspense } from "react";
import { AppPostWriter } from "@/components/social/PostsPanels";
import { UrlAccountFilter } from "@/components/UrlAccountFilter";
import { Time } from "@/components/Time";
import { ErrorNote, Loading, Notice, PageFrame, Panel } from "@/components/ui";
import { readAccounts, serverTransport } from "@/lib/server/social-api";
import type { SocialAccount } from "@/lib/social/types";
import { platformWords } from "@/lib/social/words";
import { LIST_LIMIT, SocialApiError, postApi } from "@/services/social-api";

/**
 * Publish a link post. The writer is the interactive part; the published list is read on the server for the account in
 * the address (`?account=`). GeekAPI lists posts for one account only, so there is always one: the one named, else the
 * first connected. A list that fails to read says so in its own panel, and the writer still works.
 */
export default async function PostsPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const params = await searchParams;
  const accounts = await readAccounts();
  const requested = params.account ?? null;
  const chosen = accounts.find((a) => a.id === requested) ?? accounts[0] ?? null;

  return (
    <PageFrame
      title="Posts"
      intro="Share an article as a link post. Suggest copy writes a first version; nothing is posted until you press Publish."
    >
      <AppPostWriter accounts={accounts} />

      <Panel title="Published posts" aside={chosen ? <UrlAccountFilter accounts={accounts} value={chosen.id} allowAll={false} /> : null}>
        {requested && !accounts.some((a) => a.id === requested) && chosen ? (
          <div className="mb-4">
            <Notice tone="warn">The account in the address is not one of yours, so {chosen.displayName} is shown.</Notice>
          </div>
        ) : null}
        {chosen === null ? (
          <Notice tone="warn">No Page is connected. Connect one on Accounts, and its posts are listed here.</Notice>
        ) : (
          <Suspense key={chosen.id} fallback={<Loading what="posts" />}>
            <PublishedPosts accountId={chosen.id} accounts={accounts} />
          </Suspense>
        )}
      </Panel>
    </PageFrame>
  );
}

async function PublishedPosts({ accountId, accounts }: { accountId: string; accounts: SocialAccount[] }) {
  let posts;
  try {
    posts = await postApi(serverTransport).list(accountId);
  } catch (err) {
    // GeekAPI's own refusal is shown where the list would be. Anything else is a bug and reaches the error page.
    if (!(err instanceof SocialApiError)) throw err;
    return <ErrorNote message={`Posts did not load: ${err.message}`} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        {posts.length} {posts.length === 1 ? "post" : "posts"}
      </p>
      {posts.length >= LIST_LIMIT ? (
        <Notice tone="warn">
          GeekAPI returns at most {LIST_LIMIT} posts, and it returned that many. Older posts may exist and are not shown
          here.
        </Notice>
      ) : null}
      {posts.length === 0 ? <p className="text-sm text-muted">No posts have been published.</p> : null}
      {posts.map((post) => (
        <article key={post.id} className="rounded-lg border border-border bg-background px-4 py-3">
          <p className="text-xs text-muted">
            {accounts.find((a) => a.id === post.accountId)?.displayName ?? `Account ${post.accountId}`} ·{" "}
            {platformWords(post.platform)} ·{" "}
            {post.publishedAt ? (
              <>
                published <Time value={post.publishedAt} />
              </>
            ) : post.scheduledFor ? (
              <>
                scheduled for <Time value={post.scheduledFor} />
              </>
            ) : (
              <>
                stored <Time value={post.createdAt} />, not published yet
              </>
            )}
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
  );
}
