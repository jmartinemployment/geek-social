import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PostWriter } from "@/components/social/PostWriter";
import type { LinkPost, PostCopyRequest } from "@/lib/social/types";
import { platformWords, ruleWords } from "@/lib/social/words";
import { SocialApiError } from "@/services/social-api";
import type { PostActions } from "@/services/post-actions";
import { PLATFORMS, account, storedPost } from "@/test/fixtures";

let refreshes: number;
const router = {
  refresh: () => {
    refreshes++;
  },
} as never;

beforeEach(() => {
  refreshes = 0;
});
afterEach(cleanup);

const unused: PostActions = {
  suggestCopy: async () => {
    throw new Error("not used");
  },
  publish: async () => {
    throw new Error("not used");
  },
};

function mount(actions: PostActions = unused, accounts = [account()], platforms = PLATFORMS) {
  render(
    <AppRouterContext.Provider value={router}>
      <PostWriter accounts={accounts} platforms={platforms} actions={actions} />
    </AppRouterContext.Provider>,
  );
}

const linkedIn = account({ id: "a2", platform: "linkedin_organization", displayName: "Acme Company" });

const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const publishButton = () => screen.getByRole("button", { name: /^Publish|Publishing/ }) as HTMLButtonElement;

/** Fills the New link post form far enough to publish: the account, the article and the text. */
function fillForm() {
  type("Account", "a1");
  type("Article URL", "https://geekatyourspot.com/guide");
  type("Title", "The guide");
  type("Summary", "A short summary.");
  type(/^Post text/, "Read our latest guide.");
}

test("Publish stays off until there is an account, an article address and text", () => {
  mount();
  assert.equal(publishButton().disabled, true);
  fillForm();
  assert.equal(publishButton().disabled, false);
});

test("Publish sends the post once, says where it went, clears the form and has the server read the list again", async () => {
  const sent: { accountId: string; post: LinkPost }[] = [];
  mount({ ...unused, publish: async (accountId, post) => (sent.push({ accountId, post }), storedPost({ platformPostId: "fb-post-9" })) });
  fillForm();
  click("Publish");
  await screen.findByText(/Published to Acme Page\. Post id on the platform: fb-post-9/);
  assert.deepEqual(sent, [
    {
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
    },
  ]);
  assert.equal((screen.getByLabelText(/^Post text/) as HTMLTextAreaElement).value, "", "the form is cleared");
  await waitFor(() => assert.equal(refreshes, 1));
});

test("a publish the Reviewer refuses names the rules, says nothing was posted, and can be tried again", async () => {
  mount({
    ...unused,
    publish: async () => Promise.reject(new SocialApiError("The Reviewer refused this text.", 422, "review_refused", ["promises_refund"])),
  });
  fillForm();
  click("Publish");
  await screen.findByText(/Nothing was posted/);
  screen.getByText(ruleWords("promises_refund"));
  screen.getByText(/Not published:/);
  assert.equal(publishButton().disabled, false);
  assert.equal(screen.getByLabelText(/^Post text/).textContent, "Read our latest guide.", "the text is still there to fix");
  assert.equal(refreshes, 0);
});

test("a publish that got no clear answer says the post may be live, reads the list, and holds Publish off", async () => {
  mount({ ...unused, publish: async () => Promise.reject(new SocialApiError("GeekAPI answered 504: Gateway Timeout", 504, null, [])) });
  fillForm();
  click("Publish");
  await screen.findByText("Publishing did not get a clear answer.");
  screen.getByText(/The post may have been published/);
  assert.equal(screen.queryByText(/Not published:/), null, "an uncertain result is never reported as not published");
  assert.equal(publishButton().disabled, true);
  await waitFor(() => assert.equal(refreshes, 1));
});

test("a platform write whose outcome GeekAPI could not confirm is held off the same way", async () => {
  mount({ ...unused, publish: async () => Promise.reject(new SocialApiError("The platform did not answer in time.", 502, "outcome_unknown", [])) });
  fillForm();
  click("Publish");
  await screen.findByText("Publishing did not get a clear answer.");
  assert.equal(publishButton().disabled, true);
});

test("Publish is allowed again only after the person says they checked the Page", async () => {
  mount({ ...unused, publish: async () => Promise.reject(new SocialApiError("Gateway Timeout", 504, null, [])) });
  fillForm();
  click("Publish");
  await screen.findByText("Publishing did not get a clear answer.");
  click("I checked the Page: allow Publish again");
  assert.equal(publishButton().disabled, false);
  assert.equal(screen.queryByText("Publishing did not get a clear answer."), null);
});

test("Suggest copy asks for the chosen account's platform and fills the text from the Post Writer", async () => {
  const asked: PostCopyRequest[] = [];
  mount({
    ...unused,
    suggestCopy: async (request) => (
      asked.push(request),
      { copies: [{ platform: "facebook", post: { kind: "link", text: "A first draft.", linkUrl: "https://geekatyourspot.com/guide", linkTitle: "The guide", linkDescription: null, imageUrl: null, scheduledFor: null } }] }
    ),
  });
  fillForm();
  type(/^Post text/, "");
  click("Suggest copy");
  await waitFor(() => assert.equal((screen.getByLabelText(/^Post text/) as HTMLTextAreaElement).value, "A first draft."));
  assert.deepEqual(asked, [
    { articleUrl: "https://geekatyourspot.com/guide", articleTitle: "The guide", articleSummary: "A short summary.", platforms: ["facebook"], imageUrl: null },
  ]);
  assert.equal(screen.queryByLabelText(/Link title/), null, "Facebook takes the title from the page, so the suggested one is not offered");
});

// ----- What each network accepts -----

test("for a Facebook account the form offers no link title, description or picture, says why, and sends none", async () => {
  const sent: LinkPost[] = [];
  mount({
    ...unused,
    suggestCopy: async () => ({
      copies: [{ platform: "facebook", post: { kind: "link", text: "Draft.", linkUrl: "https://geekatyourspot.com/guide", linkTitle: "Suggested title", linkDescription: "Suggested description", imageUrl: null, scheduledFor: null } }],
    }),
    publish: async (_, post) => (sent.push(post), storedPost()),
  });
  fillForm();
  assert.equal(screen.queryByLabelText(/Image URL/), null);
  assert.equal(screen.queryByLabelText(/Link title/), null);
  assert.equal(screen.queryByLabelText(/Link description/), null);
  screen.getByText(/Facebook takes the link's title, description and picture from the linked page/);

  click("Suggest copy");
  await waitFor(() => assert.equal((screen.getByLabelText(/^Post text/) as HTMLTextAreaElement).value, "Draft."));
  click("Publish");
  await waitFor(() => assert.equal(sent.length, 1));
  assert.equal(sent[0].linkTitle, null, "a suggested title Facebook would refuse is never sent");
  assert.equal(sent[0].linkDescription, null);
  assert.equal(sent[0].imageUrl, null);
});

test("on a network that takes a preview the fields are offered, and one that needs a title keeps Publish off until it has one", async () => {
  const sent: LinkPost[] = [];
  mount({ ...unused, publish: async (_, post) => (sent.push(post), storedPost()) }, [account(), linkedIn]);
  type("Account", "a2");
  type("Article URL", "https://geekatyourspot.com/guide");
  type(/^Post text/, "Read our latest guide.");
  screen.getByText("(required on this network)");
  screen.getByLabelText(/Image URL/);
  screen.getByLabelText(/Link description/);
  assert.equal(publishButton().disabled, true);
  screen.getByText(`${platformWords("linkedin_organization")} needs a link title before it can publish.`);

  type(/^Link title/, "The guide");
  type(/^Link description/, "A short guide.");
  assert.equal(publishButton().disabled, false);
  click("Publish");
  await waitFor(() => assert.equal(sent.length, 1));
  assert.equal(sent[0].linkTitle, "The guide");
  assert.equal(sent[0].linkDescription, "A short guide.");
});

test("an account whose network publishes no link post is not offered, and the form says why", () => {
  mount(unused, [account(), account({ id: "a3", platform: "instagram", displayName: "Acme Gram" })]);
  assert.equal(screen.queryByRole("option", { name: /Acme Gram/ }), null);
  screen.getByRole("option", { name: /Acme Page/ });
  screen.getByText(/Not offered here, because their network publishes no link post: Acme Gram/);
});

test("an account whose platform GeekAPI does not describe is not offered, and the form says so in red", () => {
  mount(
    unused,
    [account(), account({ id: "a4", platform: "linkedin_member", displayName: "Old Page" })],
    PLATFORMS.filter((p) => p.platform !== "linkedin_member"),
  );
  assert.equal(screen.queryByRole("option", { name: /Old Page/ }), null);
  screen.getByText(/GeekAPI does not say what a post may carry on Old Page/);
});

test("a Suggest copy that fails shows its cause, and one with no copy for the platform says so", async () => {
  mount({ ...unused, suggestCopy: async () => Promise.reject(new SocialApiError("GeekAPI answered 502: Bad Gateway", 502, null, [])) });
  fillForm();
  click("Suggest copy");
  await screen.findByText(/Suggest copy failed: GeekAPI answered 502/);
  cleanup();

  mount({ ...unused, suggestCopy: async () => ({ copies: [] }) });
  fillForm();
  click("Suggest copy");
  await screen.findByText(/The Post Writer returned no copy for Facebook/);
});

test("Suggest copy and Publish need an account chosen first", () => {
  mount();
  assert.equal((screen.getByRole("button", { name: "Suggest copy" }) as HTMLButtonElement).disabled, true);
  screen.getByText("Needs an account, the article URL, title and summary.");
});
