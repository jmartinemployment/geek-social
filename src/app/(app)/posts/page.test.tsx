import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SocialHubProvider } from "@/components/SocialHubProvider";
import { ruleWords } from "@/lib/social/words";
import { installFakeApi, json, type FakeApi } from "@/test/fake-api";
import { installFakeEventSource } from "@/test/fake-event-source";
import { account, storedPost } from "@/test/fixtures";
import PostsPage from "./page";

let api: FakeApi;

beforeEach(() => installFakeEventSource());
afterEach(() => {
  cleanup();
  api?.restore();
});

function renderPosts() {
  render(
    <SocialHubProvider>
      <PostsPage />
    </SocialHubProvider>,
  );
}

const postsOf = (accountId: string) => `GET /posts?accountId=${accountId}&limit=200`;
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

/** Fills the New link post form far enough to publish: the account, the article and the text. */
async function fillForm() {
  const writerAccount = screen.getAllByLabelText("Account")[0];
  await screen.findAllByRole("option", { name: /Acme Page/ });
  fireEvent.change(writerAccount, { target: { value: "a1" } });
  type("Article URL", "https://geekatyourspot.com/guide");
  type("Title", "The guide");
  type("Summary", "A short summary.");
  type(/^Post text/, "Read our latest guide.");
}

test("with no connected Page it says so, and asks GeekAPI for no posts", async () => {
  api = installFakeApi({ "GET /accounts": json([]) });
  renderPosts();
  await screen.findByText(/No Page is connected/);
  assert.equal(api.calls.filter((c) => c.path.startsWith("/posts")).length, 0, "GeekAPI refuses the route without an account");
});

test("it lists the posts of the first account, always asking for one account", async () => {
  api = installFakeApi({
    "GET /accounts": json([account(), account({ id: "a2", displayName: "Other Page" })]),
    [postsOf("a1")]: json([storedPost()]),
  });
  renderPosts();
  await screen.findByText("Read our latest guide.");
  screen.getByText("1 post");
  for (const call of api.calls.filter((c) => c.path.startsWith("/posts"))) {
    assert.match(call.path, /accountId=a1/);
  }
});

test("there is no All accounts choice, and choosing another account lists its posts", async () => {
  api = installFakeApi({
    "GET /accounts": json([account(), account({ id: "a2", displayName: "Other Page" })]),
    [postsOf("a1")]: json([storedPost()]),
    [postsOf("a2")]: json([storedPost({ id: "post2", accountId: "a2", text: "Other page's post." })]),
  });
  renderPosts();
  await screen.findByText("Read our latest guide.");
  const filter = screen.getAllByLabelText("Account")[1] as HTMLSelectElement;
  assert.equal(
    [...filter.options].some((o) => o.textContent === "All accounts"),
    false,
  );
  fireEvent.change(filter, { target: { value: "a2" } });
  await screen.findByText("Other page's post.");
});

test("a posts list that fails to load says so, and is not shown as no posts", async () => {
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [postsOf("a1")]: new Response("Bad Gateway", { status: 502 }),
  });
  renderPosts();
  await screen.findByText(/Posts did not load/);
  assert.equal(screen.queryByText("No posts have been published."), null);
});

test("Publish stays off until there is an account, an article address and text", async () => {
  api = installFakeApi({ "GET /accounts": json([account()]), [postsOf("a1")]: json([]) });
  renderPosts();
  await screen.findByText("No posts have been published.");
  const publish = screen.getByRole("button", { name: "Publish" }) as HTMLButtonElement;
  assert.equal(publish.disabled, true);
  await fillForm();
  assert.equal(publish.disabled, false);
});

test("Publish sends the post once, says where it went, clears the form and reads the list again", async () => {
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [postsOf("a1")]: json([]),
    "POST /posts": json(storedPost({ platformPostId: "fb-post-9" })),
  });
  renderPosts();
  await screen.findByText("No posts have been published.");
  await fillForm();
  click("Publish");
  await screen.findByText(/Published to Acme Page\. Post id on the platform: fb-post-9/);
  const [call] = api.to("POST", "/posts");
  assert.deepEqual(call.body, {
    accountId: "a1",
    post: {
      kind: "link",
      text: "Read our latest guide.",
      linkUrl: "https://geekatyourspot.com/guide",
      linkTitle: null,
      linkDescription: null,
      imageUrl: null,
      scheduledFor: null,
    },
  });
  assert.equal((screen.getByLabelText(/^Post text/) as HTMLTextAreaElement).value, "", "the form is cleared");
  await waitFor(() => assert.equal(api.to("GET", postsOf("a1").slice(4)).length, 2), { timeout: 2000 });
});

test("a publish the Reviewer refuses names the rules, says nothing was posted, and can be tried again", async () => {
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [postsOf("a1")]: json([]),
    "POST /posts": json({ error: "The Reviewer refused this text.", code: "review_refused", violations: ["promises_refund"] }, 422),
  });
  renderPosts();
  await screen.findByText("No posts have been published.");
  await fillForm();
  click("Publish");
  await screen.findByText(/Nothing was posted/);
  screen.getByText(ruleWords("promises_refund"));
  screen.getByText(/Not published:/);
  assert.equal((screen.getByRole("button", { name: "Publish" }) as HTMLButtonElement).disabled, false);
});

test("a publish that got no clear answer says the post may be live, reads the list, and holds Publish off", async () => {
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [postsOf("a1")]: json([]),
    "POST /posts": new Response("Gateway Timeout", { status: 504 }),
  });
  renderPosts();
  await screen.findByText("No posts have been published.");
  await fillForm();
  click("Publish");
  await screen.findByText("Publishing did not get a clear answer.");
  screen.getByText(/The post may have been published/);
  assert.equal(screen.queryByText(/Not published:/), null, "an uncertain result is never reported as not published");
  assert.equal((screen.getByRole("button", { name: "Publish" }) as HTMLButtonElement).disabled, true);
  await waitFor(() => assert.equal(api.to("GET", postsOf("a1").slice(4)).length, 2), { timeout: 2000 });
});

test("a platform write whose outcome GeekAPI could not confirm is held off the same way", async () => {
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [postsOf("a1")]: json([]),
    "POST /posts": json({ error: "The platform did not answer in time.", code: "outcome_unknown" }, 502),
  });
  renderPosts();
  await screen.findByText("No posts have been published.");
  await fillForm();
  click("Publish");
  await screen.findByText("Publishing did not get a clear answer.");
  assert.equal((screen.getByRole("button", { name: "Publish" }) as HTMLButtonElement).disabled, true);
});

test("Publish is allowed again only after the operator says they checked the Page", async () => {
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [postsOf("a1")]: json([]),
    "POST /posts": new Response("Gateway Timeout", { status: 504 }),
  });
  renderPosts();
  await screen.findByText("No posts have been published.");
  await fillForm();
  click("Publish");
  await screen.findByText("Publishing did not get a clear answer.");
  click("I checked the Page: allow Publish again");
  assert.equal((screen.getByRole("button", { name: "Publish" }) as HTMLButtonElement).disabled, false);
  assert.equal(screen.queryByText("Publishing did not get a clear answer."), null);
});

test("Suggest copy fills the text from the Post Writer, and a failure is shown with its cause", async () => {
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [postsOf("a1")]: json([]),
    "POST /posts/copy": json({
      copies: [{ platform: "facebook", post: { kind: "link", text: "A first draft.", linkUrl: "https://geekatyourspot.com/guide", linkTitle: "The guide", linkDescription: null, imageUrl: null, scheduledFor: null } }],
    }),
  });
  renderPosts();
  await screen.findByText("No posts have been published.");
  await fillForm();
  type(/^Post text/, "");
  click("Suggest copy");
  await waitFor(() => assert.equal((screen.getByLabelText(/^Post text/) as HTMLTextAreaElement).value, "A first draft."));
  api.restore();

  api = installFakeApi({ "POST /posts/copy": new Response("Bad Gateway", { status: 502 }) });
  click("Suggest copy");
  await screen.findByText(/Suggest copy failed: GeekAPI answered 502/);
});
