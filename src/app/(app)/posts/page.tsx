import { Suspense } from "react";
import { AppPostWriter } from "@/components/social/PostsPanels";
import { UrlAccountFilter } from "@/components/UrlAccountFilter";
import { Time } from "@/components/Time";
import { ErrorNote, Loading, Notice, PageFrame, Panel } from "@/components/ui";
import { readAccounts, serverTransport } from "@/lib/server/social-api";
import { readOrRefusal, resolveChosenAccount } from "@/lib/social/page-reads";
import type { SocialAccount } from "@/lib/social/types";
import { platformWords } from "@/lib/social/words";
import { LIST_LIMIT, platformsApi, postApi } from "@/services/social-api";

/**
 * Publish a link post. The writer is the interactive part, and it offers only what each network accepts, from GeekAPI's
 * capability matrix; without that list it cannot say what a post may carry, so it says so instead of showing a form.
 * The published list is read on the server for the account in the address (`?account=`). GeekAPI lists posts for one
 * account only, so there is always one: the one named, else the first connected. A list that fails to read says so in
 * its own panel, and the writer still works.
 */
export default async function PostsPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const params = await searchParams;
  const accounts = await readAccounts();
  const { chosen, unknown } = resolveChosenAccount(accounts, params.account ?? null);
  const platforms = await readOrRefusal(() => platformsApi(serverTransport).list());

  return (
    <PageFrame
      title="Posts"
      intro="Share an article as a link post. Suggest copy writes a first version; nothing is posted until you press Publish."
    >
      {platforms.ok ? (
        <AppPostWriter accounts={accounts} platforms={platforms.value} />
      ) : (
        <Panel title="New link post">
          <ErrorNote message={`The post form needs the list of what each network accepts, which did not load: ${platforms.message}`} />
        </Panel>
      )}

      <Panel title="Published posts" aside={chosen ? <UrlAccountFilter accounts={accounts} value={chosen.id} allowAll={false} /> : null}>
        {unknown && chosen ? (
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
  // GeekAPI's own refusal is shown where the list would be. Anything else is a bug and reaches the error page.
  const read = await readOrRefusal(() => postApi(serverTransport).list(accountId));
  if (!read.ok) return <ErrorNote message={`Posts did not load: ${read.message}`} />;
  const posts = read.value;

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
