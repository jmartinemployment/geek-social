import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SignOutButton } from "@/components/SignOutButton";
import { ToastProvider } from "@/components/Toaster";

const replaced: string[] = [];
const router = { replace: (path: string) => replaced.push(path) } as never;
const originalFetch = globalThis.fetch;

let requests: { url: string; init?: RequestInit }[];
let assigned: string[];

beforeEach(() => {
  requests = [];
  assigned = [];
  replaced.length = 0;
});
afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

function answerWith(respond: () => Response | Promise<Response>) {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: String(input), init });
    return respond();
  }) as typeof fetch;
}

const mount = () =>
  render(
    <AppRouterContext.Provider value={router}>
      <ToastProvider>
        <SignOutButton navigate={(url) => assigned.push(url)} />
      </ToastProvider>
    </AppRouterContext.Provider>,
  );
const press = () => fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

test("it signs out with a fetch (never a form post) and goes where the server says", async () => {
  answerWith(() => Response.json({ redirectTo: "https://auth.example.test/connect/logout?x=1" }));
  mount();
  press();
  await waitFor(() => assert.equal(assigned.length, 1));
  assert.equal(assigned[0], "https://auth.example.test/connect/logout?x=1");
  assert.equal(requests[0].url, "/api/auth/logout");
  assert.equal(requests[0].init?.method, "POST");
  assert.equal(document.querySelector("form"), null, "no form on the page to post back");
});

test("a request that never reached the app says the person may still be signed in", async () => {
  answerWith(() => Promise.reject(new TypeError("Failed to fetch")));
  mount();
  press();
  await screen.findByText(/may still be signed in: Failed to fetch/);
  assert.equal(assigned.length, 0);
  assert.equal((screen.getByRole("button", { name: "Sign out" }) as HTMLButtonElement).disabled, false, "it can be tried again");
});

test("an answer that is not readable is said, not taken for success", async () => {
  answerWith(() => new Response("<html>Bad Gateway</html>", { status: 502 }));
  mount();
  press();
  await screen.findByText(/answered with 502 and something unreadable/);
  assert.equal(assigned.length, 0);
});

test("a refused sign-out (another origin) is shown with the server's words", async () => {
  answerWith(() => Response.json({ error: "Sign-out must be requested from this app." }, { status: 403 }));
  mount();
  press();
  await screen.findByText("Sign-out must be requested from this app.");
  assert.equal(assigned.length, 0);
  assert.equal(replaced.length, 0);
});

test("when GeekOAuth could not end its own session, the person is told, then taken to the signed-out page", async () => {
  answerWith(() =>
    Response.json({ error: "Signed out of GeekSocial, but not of GeekOAuth: it could not be reached.", redirectTo: "https://geek-social.example.test/signed-out" }, { status: 502 }),
  );
  mount();
  press();
  await screen.findByText(/but not of GeekOAuth/);
  assert.deepEqual(replaced, ["/signed-out"]);
  assert.equal(assigned.length, 0);
});
