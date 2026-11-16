import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { MetaConnectComplete } from "@/lib/social/types";
import { SocialApiError } from "@/services/social-api";
import { account } from "@/test/fixtures";
import { MetaCallbackView } from "./callback-view";

afterEach(cleanup);

function mount(query: string, complete: (code: string, state: string) => Promise<MetaConnectComplete>) {
  return render(
    <SearchParamsContext.Provider value={new URLSearchParams(query) as never}>
      <MetaCallbackView complete={complete} />
    </SearchParamsContext.Provider>,
  );
}

const never = async (): Promise<MetaConnectComplete> => {
  throw new Error("must not be called");
};

test("Meta's code and state go to GeekAPI once, and the connected Page and its comment updates are shown", async () => {
  const calls: string[][] = [];
  mount("code=abc&state=xyz", async (code, state) => (
    calls.push([code, state]),
    { accounts: [account()], subscriptions: [{ accountId: "a1", active: true }] }
  ));
  await screen.findByRole("heading", { name: "Connected" });
  screen.getByText("Acme Page");
  screen.getByText("Comment updates are on for this Page.");
  assert.deepEqual(calls, [["abc", "xyz"]]);
});

test("a Page whose comment updates are not on says new comments will not arrive", async () => {
  mount("code=abc&state=xyz", async () => ({ accounts: [account()], subscriptions: [{ accountId: "a1", active: false }] }));
  await screen.findByText(/Comment updates are not on for this Page/);
});

test("a connect that returns no Pages says nothing was connected", async () => {
  mount("code=abc&state=xyz", async () => ({ accounts: [], subscriptions: [] }));
  await screen.findByText(/completed the connect but returned no Pages/);
});

test("a refusal from GeekAPI is shown with its own sentence and a way back, never as connected", async () => {
  mount("code=abc&state=xyz", async () => Promise.reject(new SocialApiError("That connect expired.", 400, "invalid_state", [])));
  await screen.findByText(/The connect was not completed: That connect expired\./);
  screen.getByRole("link", { name: "Back to Accounts" });
  assert.equal(screen.queryByRole("heading", { name: "Connected" }), null);
});

test("Meta declining says why, and GeekAPI is never asked", async () => {
  mount("error=access_denied&error_reason=user_denied&error_description=Permissions+declined", never);
  await screen.findByText(/Meta did not connect the Page: Permissions declined \(permission was declined on Meta's screen\)/);
});

test("a return with no code, or no state, says so and asks GeekAPI for nothing", async () => {
  mount("state=xyz", never);
  await screen.findByText("Meta sent you back without a code, so nothing can be connected.");
  cleanup();
  mount("code=abc", never);
  await waitFor(() => screen.getByText(/without the state GeekSocial gave it/));
});
