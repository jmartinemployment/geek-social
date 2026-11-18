import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SocialHubProvider } from "@/components/SocialHubProvider";
import { AccountsView, ConnectPanel } from "@/components/social/AccountsView";
import type { AccountSettings } from "@/lib/social/types";
import { SocialApiError } from "@/services/social-api";
import type { AccountActions } from "@/services/account-actions";
import { FakeEventSource, installFakeEventSource } from "@/test/fake-event-source";
import { account } from "@/test/fixtures";

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

const unused: AccountActions = {
  save: async () => {
    throw new Error("not used");
  },
  resync: async () => {
    throw new Error("not used");
  },
  connect: async () => {
    throw new Error("not used");
  },
};

function mount(accounts = [account()], actions: AccountActions = unused) {
  const ui = (list: typeof accounts) => (
    <AppRouterContext.Provider value={router}>
      <SocialHubProvider>
        <AccountsView accounts={list} actions={actions} />
      </SocialHubProvider>
    </AppRouterContext.Provider>
  );
  const view = render(ui(accounts));
  return { rerender: (list: typeof accounts) => view.rerender(ui(list)) };
}

const box = (name: string) => screen.getByRole("checkbox", { name }) as HTMLInputElement;
const save = () => screen.getByRole("button", { name: /^Save|Saving/ }) as HTMLButtonElement;

test("it shows each account with its platform and status, and says when there are none", () => {
  mount([account(), account({ id: "a2", displayName: "Second Page", status: "reconnect_required" })]);
  screen.getByText("Acme Page");
  screen.getByText("Second Page");
  screen.getByText(/The platform refused this account's sign-in/);
  cleanup();
  mount([]);
  screen.getByText(/No account is connected yet/);
});

const PAUSE = "Pause every send from this account";

test("Save is off until something changes, and nothing is sent by ticking the box", () => {
  const saved: unknown[] = [];
  mount([account()], { ...unused, save: async (...args) => (saved.push(args), account()) });
  assert.equal(save().disabled, true);
  fireEvent.click(box(PAUSE));
  assert.equal(save().disabled, false);
  screen.getByText("Unsaved changes");
  assert.equal(saved.length, 0);
});

test("the pause is the only setting: there is no way to send without approval", () => {
  mount([account()]);
  assert.equal(screen.queryByText(/Send without approval/), null);
  assert.equal(screen.queryAllByRole("checkbox").length, 1);
  screen.getByText(/not even a reply you approved/);
});

test("Save sends exactly the pause", async () => {
  const sent: { id: string; settings: AccountSettings }[] = [];
  mount([account()], { ...unused, save: async (id, settings) => (sent.push({ id, settings }), account({ sendsDisabled: true })) });
  fireEvent.click(box(PAUSE));
  fireEvent.click(save());
  await screen.findByText("Settings saved.");
  assert.deepEqual(sent, [{ id: "a1", settings: { sendsDisabled: true } }]);
  assert.equal(screen.queryByText("Unsaved changes"), null, "the form is back to what the server holds");
});

test("a save GeekAPI refuses shows its sentence and keeps what was ticked, so it can be tried again", async () => {
  mount([account()], { ...unused, save: async () => Promise.reject(new SocialApiError("The account is not yours.", 404, "not_found", [])) });
  fireEvent.click(box(PAUSE));
  fireEvent.click(save());
  await screen.findByText(/Settings were not saved: The account is not yours\./);
  assert.equal(box(PAUSE).checked, true, "the person's choice is still there");
  screen.getByText("Unsaved changes");
  assert.equal(save().disabled, false);
});

test("Discard puts the form back to what the server holds", () => {
  mount([account()]);
  fireEvent.click(box(PAUSE));
  fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
  assert.equal(box(PAUSE).checked, false);
  assert.equal(screen.queryByText("Unsaved changes"), null);
});

test("an untouched form follows the server's new list, so a change from elsewhere shows", () => {
  const view = mount([account()]);
  assert.equal(box(PAUSE).checked, false);
  view.rerender([account({ sendsDisabled: true })]);
  assert.equal(box(PAUSE).checked, true);
  screen.getByText("Sends paused");
});

test("Resync shows what was read and stored, and a failed Resync shows its sentence", async () => {
  mount([account()], { ...unused, resync: async () => ({ postsRead: 1, commentsRead: 3, stored: 2 }) });
  fireEvent.click(screen.getByRole("button", { name: "Resync comments" }));
  await screen.findByText(/Read 1 post and 3 comments; stored 2 the webhooks had missed\./);
  cleanup();
  mount([account()], { ...unused, resync: async () => Promise.reject(new SocialApiError("The platform timed out.", 504, null, [])) });
  fireEvent.click(screen.getByRole("button", { name: "Resync comments" }));
  await screen.findByText(/Resync failed: .*The platform timed out\./);
});

test("an account change on the live connection, a reconnect, and Reload each make the server read the list again", () => {
  mount([account()]);
  act(() => FakeEventSource.instances[0].send("live"));
  assert.equal(refreshes, 1);
  act(() => FakeEventSource.instances[0].send("accountChanged", { accountId: "a1" }));
  assert.equal(refreshes, 2);
  fireEvent.click(screen.getByRole("button", { name: "Reload" }));
  assert.equal(refreshes, 3);
});

test("Connect shows GeekAPI's sentence when the start failed, and is pressable again", async () => {
  render(<ConnectPanel actions={{ ...unused, connect: async () => "Meta is not configured." }} />);
  fireEvent.click(screen.getByRole("button", { name: "Connect a Facebook Page" }));
  await screen.findByText("Could not start connecting: Meta is not configured.");
  assert.equal((screen.getByRole("button", { name: "Connect a Facebook Page" }) as HTMLButtonElement).disabled, false);
});

test("Connect shows a thrown failure too, never nothing", async () => {
  render(
    <ConnectPanel
      actions={{ ...unused, connect: async () => Promise.reject(new SocialApiError("Could not reach GeekAPI: offline", 0, null, [])) }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Connect a Facebook Page" }));
  await waitFor(() => screen.getByText(/Could not reach GeekAPI: offline/));
});
