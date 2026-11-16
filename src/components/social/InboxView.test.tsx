import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SocialHubProvider } from "@/components/SocialHubProvider";
import { InboxView } from "@/components/social/InboxView";
import { ToastProvider } from "@/components/Toaster";
import type { DraftActions } from "@/services/draft-actions";
import { FakeEventSource, installFakeEventSource } from "@/test/fake-event-source";
import { account, draft } from "@/test/fixtures";

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

const noActions: DraftActions = {
  saveText: async () => {
    throw new Error("not used");
  },
  approve: async () => {
    throw new Error("not used");
  },
  send: async () => {
    throw new Error("not used");
  },
  reject: async () => {
    throw new Error("not used");
  },
  read: async () => {
    throw new Error("not used");
  },
};

function mount(props: Partial<React.ComponentProps<typeof InboxView>> = {}) {
  const ui = (p: Partial<React.ComponentProps<typeof InboxView>>) => (
    <AppRouterContext.Provider value={router}>
      <ToastProvider>
        <SocialHubProvider>
          <InboxView drafts={[]} accounts={[account()]} emptyText="Nothing here." truncated={false} actions={noActions} {...p} />
        </SocialHubProvider>
      </ToastProvider>
    </AppRouterContext.Provider>
  );
  const view = render(ui(props));
  return { rerender: (next: Partial<React.ComponentProps<typeof InboxView>>) => view.rerender(ui({ ...props, ...next })) };
}

test("it shows the drafts the server sent, with the account's name", () => {
  mount({ drafts: [draft({ id: "d1" }), draft({ id: "d2", comment: { ...draft().comment, text: "Do you ship?" } })] });
  screen.getByText("2 drafts");
  screen.getByText("When do you open?");
  screen.getByText("Do you ship?");
  assert.ok(screen.getAllByText(/Acme Page/).length >= 2);
});

test("an empty list says why it is empty, in the tab's own words", () => {
  mount({ emptyText: "No drafts are waiting for a decision." });
  screen.getByText("0 drafts");
  screen.getByText("No drafts are waiting for a decision.");
});

test("a list GeekAPI cut off at its limit says older drafts may exist", () => {
  mount({ drafts: [draft()], truncated: true });
  screen.getByText(/returns at most 200 drafts per status/);
});

test("a draft the person acted on stays in view after the server's next list no longer has it, and the others follow the server", async () => {
  const rejected = draft({ id: "d1", status: "rejected" });
  const actions: DraftActions = { ...noActions, reject: async () => rejected, read: async () => rejected };
  const first = mount({ drafts: [draft({ id: "d1" }), draft({ id: "d2", comment: { ...draft().comment, text: "Second one" } })], actions });

  fireEvent.click(screen.getAllByRole("button", { name: "Reject" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "Reject for good?" }));
  await waitFor(() => screen.getByText("Rejected"));

  // The server's next render: d1 left the Pending tab, d2 is still there, d3 arrived.
  first.rerender({ drafts: [draft({ id: "d2", comment: { ...draft().comment, text: "Second one" } }), draft({ id: "d3", comment: { ...draft().comment, text: "Third one" } })] });

  screen.getByText("Second one");
  screen.getByText("Third one");
  screen.getByText("When do you open?");
  screen.getByText("3 drafts");
});

test("a draft the new list still holds is shown as the server holds it, not as this screen last saw it", async () => {
  const rejected = draft({ id: "d1", status: "rejected" });
  const actions: DraftActions = { ...noActions, reject: async () => rejected, read: async () => rejected };
  const first = mount({ drafts: [draft({ id: "d1" })], actions });

  fireEvent.click(screen.getByRole("button", { name: "Reject" }));
  fireEvent.click(screen.getByRole("button", { name: "Reject for good?" }));
  await waitFor(() => screen.getByText("Rejected"));

  // The server still lists it, as pending: it is fresher than the screen's own copy.
  first.rerender({ drafts: [draft({ id: "d1" })] });
  await waitFor(() => assert.equal(screen.queryByText("Rejected"), null));
  screen.getByRole("button", { name: "Approve and send" });
});

test("a live draft message makes the server read the list again, and so does a reconnect", () => {
  mount({ drafts: [draft()] });
  act(() => FakeEventSource.instances[0].send("live"));
  assert.equal(refreshes, 1, "the connect's resync refreshed");
  act(() => FakeEventSource.instances[0].send("draftChanged", { draftId: "d9", accountId: "a1", status: "sent" }));
  assert.equal(refreshes, 2);
});

test("Reload drops the drafts the person acted on that the server no longer lists, where a live refresh keeps them", async () => {
  const rejected = draft({ id: "d1", status: "rejected" });
  const actions: DraftActions = { ...noActions, reject: async () => rejected, read: async () => rejected };
  const view = mount({ drafts: [draft({ id: "d1" }), draft({ id: "d2", comment: { ...draft().comment, text: "Second one" } })], actions });
  fireEvent.click(screen.getAllByRole("button", { name: "Reject" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "Reject for good?" }));
  await waitFor(() => screen.getByText("Rejected"));

  view.rerender({ drafts: [draft({ id: "d2", comment: { ...draft().comment, text: "Second one" } })] });
  screen.getByText("2 drafts");

  fireEvent.click(screen.getByRole("button", { name: "Reload" }));
  await waitFor(() => screen.getByText("1 draft"));
  assert.equal(screen.queryByText("Rejected"), null);
});

test("Reload makes the server read the list again", () => {
  mount({ drafts: [draft()] });
  fireEvent.click(screen.getByRole("button", { name: "Reload" }));
  assert.equal(refreshes, 1);
});
