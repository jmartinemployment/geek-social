import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SocialHubProvider } from "@/components/SocialHubProvider";
import { installFakeApi, json, type FakeApi } from "@/test/fake-api";
import { FakeEventSource, installFakeEventSource } from "@/test/fake-event-source";
import { account, draft } from "@/test/fixtures";
import InboxPage from "./page";

let api: FakeApi;

beforeEach(() => installFakeEventSource());
afterEach(() => {
  cleanup();
  api?.restore();
});

/** The Inbox inside the real live-connection provider, whose stream the test drives. */
function renderInbox() {
  render(
    <SocialHubProvider>
      <InboxPage />
    </SocialHubProvider>,
  );
  return {
    stream: FakeEventSource.instances[0],
    /** The server's live event, as it arrives after every connect. */
    live: () => act(() => FakeEventSource.instances[0].send("live")),
    draftChanged: (body: { draftId: string; accountId: string; status: string }) =>
      act(() => FakeEventSource.instances[0].send("draftChanged", body)),
  };
}

const pendingList = "GET /drafts?status=pending&limit=200";
const sentList = "GET /drafts?status=sent&limit=200";
const tab = (name: string) => screen.getByRole("tab", { name });

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

test("it lists the pending drafts, with the account's name", async () => {
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [pendingList]: json([draft({ id: "d1" }), draft({ id: "d2", comment: { ...draft().comment, text: "Do you ship?" } })]),
  });
  renderInbox();
  await screen.findByText("2 drafts");
  screen.getByText("When do you open?");
  screen.getByText("Do you ship?");
  assert.equal(screen.getAllByText(/Acme Page/).length >= 2, true);
});

test("a list that fails to load says so, and is not shown as no drafts", async () => {
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [pendingList]: new Response("Bad Gateway", { status: 502 }),
  });
  renderInbox();
  await screen.findByText(/Drafts did not load/);
  assert.equal(screen.queryByText("No drafts are waiting for a decision."), null);
});

test("a tab reads the statuses it covers, and says when it is empty", async () => {
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [pendingList]: json([]),
    "GET /drafts?status=approved&limit=200": json([draft({ id: "d5", status: "approved" })]),
    "GET /drafts?status=sending&limit=200": json([]),
  });
  renderInbox();
  await screen.findByText("No drafts are waiting for a decision.");
  fireEvent.click(tab("Approved, held"));
  await screen.findByText("1 draft");
  assert.equal(api.to("GET", "/drafts?status=sending&limit=200").length, 1);
});

test("a live draft message reads that draft and puts it in the list", async () => {
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [pendingList]: json([draft({ id: "d1" })]),
    "GET /drafts/d2": json(draft({ id: "d2", comment: { ...draft().comment, text: "New question" } })),
  });
  const { draftChanged } = renderInbox();
  await screen.findByText("1 draft");
  await draftChanged({ draftId: "d2", accountId: "a1", status: "pending" });
  await screen.findByText("New question");
  screen.getByText("2 drafts");
});

test("a live message for a draft that left this tab takes it out of the list", async () => {
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [pendingList]: json([draft({ id: "d1" })]),
    "GET /drafts/d1": json(draft({ id: "d1", status: "sent" })),
  });
  const { draftChanged } = renderInbox();
  await screen.findByText("1 draft");
  await draftChanged({ draftId: "d1", accountId: "a1", status: "sent" });
  await screen.findByText("No drafts are waiting for a decision.");
});

test("a live message for another account is ignored when the list is filtered to one", async () => {
  api = installFakeApi({
    "GET /accounts": json([account(), account({ id: "a2", displayName: "Other Page" })]),
    [pendingList]: json([draft({ id: "d1" })]),
    "GET /drafts?status=pending&accountId=a1&limit=200": json([draft({ id: "d1" })]),
  });
  const { draftChanged } = renderInbox();
  await screen.findByText("1 draft");
  fireEvent.change(screen.getByLabelText("Account"), { target: { value: "a1" } });
  await waitFor(() => assert.equal(api.to("GET", "/drafts?status=pending&accountId=a1&limit=200").length, 1));
  await draftChanged({ draftId: "d9", accountId: "a2", status: "pending" });
  assert.equal(api.to("GET", "/drafts/d9").length, 0, "a draft on another account is not even read");
});

test("a live message whose draft cannot be read is shown as an error, not dropped", async () => {
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [pendingList]: json([draft({ id: "d1" })]),
    "GET /drafts/d2": new Response("Service Unavailable", { status: 503 }),
  });
  const { draftChanged } = renderInbox();
  await screen.findByText("1 draft");
  await draftChanged({ draftId: "d2", accountId: "a1", status: "pending" });
  await screen.findByText(/A draft changed \(d2, now pending\) and reading it failed/);
  fireEvent.click(screen.getByRole("button", { name: "Clear these errors" }));
  assert.equal(screen.queryByText(/reading it failed/), null);
});

test("a live message that finishes after the operator changed tab is not put into the new tab", async () => {
  const slow = deferredResponse();
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [pendingList]: json([draft({ id: "d1" })]),
    [sentList]: json([]),
    "GET /drafts/d2": () => slow.promise,
  });
  const { draftChanged } = renderInbox();
  await screen.findByText("1 draft");

  // A pending draft is announced, and its read is still in flight when the operator opens Sent.
  await draftChanged({ draftId: "d2", accountId: "a1", status: "pending" });
  fireEvent.click(tab("Sent"));
  await screen.findByText("No replies have been sent.");

  await act(async () => slow.resolve(json(draft({ id: "d2", status: "pending" }))));
  assert.equal(screen.queryByText("When do you open?"), null, "the pending draft did not land in the Sent tab");
  screen.getByText("No replies have been sent.");
});

test("every connect reads the list again, so nothing missed while disconnected stays missing", async () => {
  let reads = 0;
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [pendingList]: () => {
      reads++;
      return json(reads === 1 ? [draft({ id: "d1" })] : [draft({ id: "d1" }), draft({ id: "d3", comment: { ...draft().comment, text: "Arrived while offline" } })]);
    },
  });
  const { live } = renderInbox();
  await screen.findByText("1 draft");
  await live();
  await screen.findByText("Arrived while offline");
  screen.getByText("2 drafts");
});

test("acting on a draft keeps it in view after it leaves the tab, so its outcome is not taken away", async () => {
  const sent = draft({ id: "d1", status: "sent", sentPlatformCommentId: "r1" });
  api = installFakeApi({
    "GET /accounts": json([account()]),
    [pendingList]: json([draft({ id: "d1" })]),
    "POST /drafts/d1/approve": json({ draft: sent, send: { sent: true, held: false } }),
  });
  renderInbox();
  const card = (await screen.findByText("When do you open?")).closest("article") as HTMLElement;
  fireEvent.click(within(card).getByRole("button", { name: "Approve and send" }));
  await within(card).findByText("Sent.");
  screen.getByText("When do you open?");
  screen.getByText("1 draft");
});
