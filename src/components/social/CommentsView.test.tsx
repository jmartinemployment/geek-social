import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SocialHubProvider } from "@/components/SocialHubProvider";
import { CommentsView } from "@/components/social/CommentsView";
import { COMMENT_TABS, isRerunnable } from "@/lib/social/comments";
import { SocialApiError } from "@/services/social-api";
import type { CommentActions } from "@/services/comment-actions";
import { FakeEventSource, installFakeEventSource } from "@/test/fake-event-source";
import { account, commentView } from "@/test/fixtures";

let refreshes: number;
const router = {
  refresh: () => {
    refreshes++;
  },
} as never;

beforeEach(() => {
  refreshes = 0;
  installFakeEventSource();
});
afterEach(cleanup);

const failed = COMMENT_TABS[1];
const held = COMMENT_TABS[0];
const noReply = COMMENT_TABS[3];

const unused: CommentActions = {
  rerun: async () => {
    throw new Error("not used");
  },
  like: async () => {
    throw new Error("not used");
  },
};

function mount(props: Partial<React.ComponentProps<typeof CommentsView>> = {}) {
  render(
    <AppRouterContext.Provider value={router}>
      <SocialHubProvider>
        <CommentsView comments={[]} accounts={[account()]} tab={failed} actions={unused} {...props} />
      </SocialHubProvider>
    </AppRouterContext.Provider>,
  );
}

test("only the held and failed tabs can run Triage again", () => {
  assert.deepEqual(COMMENT_TABS.filter(isRerunnable).map((t) => t.id), ["held", "failed"]);
});

test("it shows the comments the server sent, with the account's name and why Triage failed", () => {
  mount({ comments: [commentView(), commentView({ id: "c2", text: "Do you ship?" })] });
  screen.getByText("2 comments");
  screen.getByText("Is this open on Sundays?");
  screen.getByText("Do you ship?");
  assert.ok(screen.getAllByText(/Acme Page/).length >= 2);
  assert.ok(screen.getAllByText(/Why Triage failed/).length >= 2);
});

test("a comment whose text was removed after retention says so, never an empty box", () => {
  mount({ comments: [commentView({ text: null, authorDisplayName: null })] });
  screen.getByText("Comment text removed after its retention period");
  screen.getByText(/Commenter name removed after its retention period wrote/);
});

test("an empty tab says why in its own words, and the held tab explains the clearance", () => {
  mount({ tab: held });
  screen.getByText("No comments are held for clearance.");
  screen.getByText(/GEEK_SOCIAL_CLAUDE_CLEARED_PLATFORMS/);
});

test("a tab where Triage cannot be run again has no Run again button", () => {
  mount({ tab: noReply, comments: [commentView({ triageOutcome: "no_reply_needed", triageFailureCode: null })] });
  assert.equal(screen.queryByRole("button", { name: "Run again" }), null);
  screen.getByRole("button", { name: "Like" });
});

test("Run again calls the action with the comment, says what Triage decided, and makes the server read the list again", async () => {
  const calls: string[] = [];
  mount({
    comments: [commentView()],
    actions: { ...unused, rerun: async (id) => (calls.push(id), { outcome: "draft_created" }) },
  });
  fireEvent.click(screen.getByRole("button", { name: "Run again" }));
  await waitFor(() => assert.equal(refreshes, 1));
  assert.deepEqual(calls, ["c1"]);
  screen.getByText(/Triage ran again on the comment by Sam/);
});

test("a Run again that GeekAPI refuses shows its own sentence on the card and does not refresh", async () => {
  mount({
    comments: [commentView()],
    actions: { ...unused, rerun: async () => Promise.reject(new SocialApiError("Triage is not configured.", 503, "not_configured", [])) },
  });
  fireEvent.click(screen.getByRole("button", { name: "Run again" }));
  await screen.findByText(/Run again failed: Triage is not configured\./);
  assert.equal(refreshes, 0);
  assert.equal((screen.getByRole("button", { name: "Run again" }) as HTMLButtonElement).disabled, false);
});

test("Like shows the platform's reaction id, then cannot be pressed twice", async () => {
  mount({ comments: [commentView()], actions: { ...unused, like: async () => ({ platformReactionId: "r-9" }) } });
  fireEvent.click(screen.getByRole("button", { name: "Like" }));
  await screen.findByText("Liked. Reaction id on the platform: r-9");
  assert.equal((screen.getByRole("button", { name: "Liked" }) as HTMLButtonElement).disabled, true);
});

test("a Like that fails says so and can be tried again", async () => {
  mount({
    comments: [commentView()],
    actions: { ...unused, like: async () => Promise.reject(new SocialApiError("The platform refused.", 502, "platform_error", [])) },
  });
  fireEvent.click(screen.getByRole("button", { name: "Like" }));
  await screen.findByText(/Like failed: The platform refused\./);
  assert.equal((screen.getByRole("button", { name: "Like" }) as HTMLButtonElement).disabled, false);
});

test("a list GeekAPI cut off at its limit says older comments may exist", () => {
  mount({ comments: Array.from({ length: 200 }, (_, i) => commentView({ id: `c${i}` })) });
  screen.getByText(/returns at most 200 comments/);
});

test("a live comment message and a reconnect each make the server read the list again, and so does Reload", () => {
  mount({ comments: [commentView()] });
  act(() => FakeEventSource.instances[0].send("live"));
  assert.equal(refreshes, 1);
  act(() => FakeEventSource.instances[0].send("commentChanged", { eventId: "e1", accountId: "a1", outcome: "failed" }));
  assert.equal(refreshes, 2);
  fireEvent.click(screen.getByRole("button", { name: "Reload" }));
  assert.equal(refreshes, 3);
});
