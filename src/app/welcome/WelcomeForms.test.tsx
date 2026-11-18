import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/components/Toaster";
import { WelcomeForms } from "@/app/welcome/WelcomeForms";
import type { WelcomeState } from "@/app/welcome/actions";
import type { SocialTenant } from "@/lib/social/types";

afterEach(cleanup);

const tenant = (accepted: string | null): SocialTenant => ({
  id: "t1",
  ownerUserId: "u1",
  name: "Acme",
  aiConsentAcceptedAt: accepted,
  createdAt: "2026-11-16T12:00:00Z",
});

const never = async (): Promise<WelcomeState> => {
  throw new Error("This action must not run in this test.");
};

function mount(props: Partial<React.ComponentProps<typeof WelcomeForms>> & { tenant: SocialTenant | null }) {
  return render(
    <ToastProvider>
      <WelcomeForms signUp={never} acceptTerms={never} {...props} />
    </ToastProvider>,
  );
}

test("a person with no tenant sees the sign-up form with the business name empty, and no terms", () => {
  mount({ tenant: null });
  assert.equal((screen.getByLabelText("Business name") as HTMLInputElement).value, "");
  assert.ok(screen.getByRole("button", { name: "Sign up for GeekSocial" }));
  assert.equal(screen.queryByRole("button", { name: "Agree" }), null);
});

test("signing up runs the sign-up action with the name typed", async () => {
  const seen: string[] = [];
  mount({
    tenant: null,
    signUp: async (_previous, formData) => {
      seen.push(String(formData.get("name")));
      return { error: null };
    },
  });
  fireEvent.change(screen.getByLabelText("Business name"), { target: { value: "Acme" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign up for GeekSocial" }));
  await waitFor(() => assert.deepEqual(seen, ["Acme"]));
});

test("a sign-up that fails says why, inline, and stays on the form", async () => {
  mount({ tenant: null, signUp: async () => ({ error: "GeekSocial could not sign you up. (GeekAPI answered 503.)" }) });
  fireEvent.change(screen.getByLabelText("Business name"), { target: { value: "Acme" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign up for GeekSocial" }));
  const alerts = await screen.findAllByRole("alert");
  assert.ok(alerts.some((a) => /could not sign you up/.test(a.textContent ?? "")));
  assert.ok(screen.getByRole("button", { name: "Sign up for GeekSocial" }));
});

test("a sign-up that fails keeps the name that was typed, so a retry sends it again", async () => {
  const sent: string[] = [];
  mount({
    tenant: null,
    signUp: async (_previous, formData) => {
      const name = String(formData.get("name"));
      sent.push(name);
      return { error: "GeekSocial could not sign you up. (GeekAPI answered 503.)", name };
    },
  });
  fireEvent.change(screen.getByLabelText("Business name"), { target: { value: "Acme Bookkeeping" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign up for GeekSocial" }));
  await screen.findAllByRole("alert");
  await waitFor(() => assert.equal((screen.getByLabelText("Business name") as HTMLInputElement).value, "Acme Bookkeeping"));

  fireEvent.click(screen.getByRole("button", { name: "Sign up for GeekSocial" }));
  await waitFor(() => assert.deepEqual(sent, ["Acme Bookkeeping", "Acme Bookkeeping"]));
});

test("a tenant that has not agreed sees the terms and the agree form, and the inbox link", () => {
  mount({ tenant: tenant(null) });
  assert.ok(screen.getByRole("button", { name: "Agree" }));
  assert.match(document.body.textContent ?? "", /approves every reply before anything is posted/);
  assert.equal(screen.getByRole("link", { name: "Open the inbox" }).getAttribute("href"), "/");
});

test("the terms name everything that goes to the AI provider: the comment, the commenter's name, the post, and an article with the business's name", () => {
  mount({ tenant: tenant(null) });
  const text = (document.body.textContent ?? "").replace(/\s+/g, " ");
  assert.match(text, /the text of a comment, the commenter's name and the post it is under to the AI provider/);
  assert.match(text, /the article's address, title and summary, and your business's name/);
  assert.match(text, /my comments, with the commenters' names, and the articles I ask it to post about, to an AI provider/);
});

test("agreeing runs the terms action, and a failure is said inline", async () => {
  let ran = 0;
  mount({
    tenant: tenant(null),
    acceptTerms: async () => {
      ran++;
      return { error: "GeekSocial could not record your answer. (GeekAPI answered 503.)" };
    },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Agree" }));
  const alerts = await screen.findAllByRole("alert");
  assert.equal(ran, 1);
  assert.ok(alerts.some((a) => /could not record your answer/.test(a.textContent ?? "")));
});

test("a tenant that has agreed sees when, and no agree form", () => {
  mount({ tenant: tenant("2026-11-16T15:00:00Z") });
  assert.match(document.body.textContent ?? "", /You agreed on November 16, 2026/);
  assert.equal(screen.queryByRole("button", { name: "Agree" }), null);
});
