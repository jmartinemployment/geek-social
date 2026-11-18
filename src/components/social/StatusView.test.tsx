import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SocialHubProvider } from "@/components/SocialHubProvider";
import { LiveRefresh, ReloadButton } from "@/components/social/LiveRefresh";
import { StatusView } from "@/components/social/StatusView";
import type { OrchestratorStatus, SocialStatus } from "@/lib/social/types";
import { FakeEventSource, installFakeEventSource } from "@/test/fake-event-source";

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

const orchestrator = (overrides: Partial<OrchestratorStatus> = {}): OrchestratorStatus => ({
  recoveredAt: "2026-11-16T12:00:00Z",
  eventsRecoveredAtStartup: 0,
  interruptedSendsFailed: 0,
  eventsScrubbed: 0,
  eventsTakenIn: 12,
  commentsReplyNeeded: 7,
  commentsNoReplyNeeded: 3,
  commentsBlockedNoClearance: 0,
  commentsFailed: 2,
  draftsPending: 4,
  draftsForAPerson: 1,
  draftsRefused: 0,
  draftsAutoApproved: 0,
  draftsSent: 5,
  draftsSendFailed: 1,
  sendsHeld: 0,
  failures: [],
  ...overrides,
});

const status = (overrides: Partial<SocialStatus> = {}): SocialStatus => ({
  orchestrator: orchestrator(),
  aiProvider: { id: "openai", name: "OpenAI", model: "gpt-test", apiKeySet: true },
  clearedPlatforms: ["facebook"],
  metaConfigured: true,
  sendLimits: { repliesPerAccountPerHour: 30, coolDownMinutes: 5 },
  ...overrides,
});

test("it shows the AI provider and what is cleared for it, the Meta settings, the send limits and the counts", () => {
  render(<StatusView status={status()} />);
  screen.getByText("OpenAI");
  screen.getByText("Model gpt-test");
  screen.getByText("Cleared for OpenAI");
  screen.getByText("Facebook");
  assert.equal(screen.queryByText(/Claude/), null);
  assert.equal(screen.queryByText(/No key set|No model set|No AI provider/), null);
  screen.getByText("Set on GeekAPI");
  screen.getByText(/30 replies per account per hour; a 5 minute cool-down/);
  screen.getByText("Comments taken in");
  screen.getByText("12");
  screen.getByText("None.");
  assert.equal(screen.queryByText(/No platform is cleared/), null);
});

test("with no platform cleared and no Meta settings it says both, in red, and why comments are held", () => {
  render(<StatusView status={status({ clearedPlatforms: [], metaConfigured: false })} />);
  screen.getByText("No platform");
  screen.getByText("Not set on GeekAPI");
  screen.getByText(/No platform is cleared for OpenAI, so every new comment is held and nothing is sent to OpenAI/);
  screen.getByText(/a change of provider clears none/);
  screen.getByText(/The Meta app id, secret and verify token are not set on GeekAPI/);
  assert.equal(screen.queryByText(/GEEK_SOCIAL|LlmProviders/), null, "no setting name on the screen");
});

test("with no AI provider it says so, in red, and that nothing is sent", () => {
  render(<StatusView status={status({ aiProvider: null, clearedPlatforms: [] })} />);
  screen.getByText("Not set on GeekAPI");
  screen.getByText("Cleared platforms");
  screen.getByText(/No AI provider is set on GeekAPI, so every new comment is held/);
  assert.equal(screen.queryByText(/No platform is cleared for/), null);
  assert.equal(screen.queryByText(/GEEK_SOCIAL|LlmProviders/), null, "no setting name on the screen");
});

test("a provider with no model or no key says which is missing and that every call fails", () => {
  render(<StatusView status={status({ aiProvider: { id: "gemini", name: "Google Gemini", model: null, apiKeySet: false } })} />);
  screen.getByText("No model set");
  screen.getByText("No key set");
  screen.getByText(/Google Gemini is the AI provider, but its model and key are not set on GeekAPI/);
  cleanup();

  render(<StatusView status={status({ aiProvider: { id: "groq", name: "Groq", model: "m", apiKeySet: false } })} />);
  screen.getByText(/Groq is the AI provider, but its key is not set on GeekAPI, so every AI call fails/);
  assert.equal(screen.queryByText("No model set"), null);
});

test("orchestrator failures are listed with when, which step and what it means", () => {
  render(
    <StatusView
      status={status({ orchestrator: orchestrator({ failures: [{ step: "triage", code: "triage_failed", at: "2026-11-16T12:05:00Z" }] }) })}
    />,
  );
  assert.equal(screen.queryByText("None."), null);
  screen.getByText(/triage:/);
});

test("an orchestrator that has not finished recovering says so instead of showing a date", () => {
  render(<StatusView status={status({ orchestrator: orchestrator({ recoveredAt: null }) })} />);
  screen.getByText("It has not finished recovering since GeekAPI started.");
});

test("LiveRefresh makes the server read again on the messages it is given, on a reconnect, and on nothing else", () => {
  render(
    <AppRouterContext.Provider value={router}>
      <SocialHubProvider>
        <LiveRefresh names={["draftChanged", "resync"]} />
      </SocialHubProvider>
    </AppRouterContext.Provider>,
  );
  act(() => FakeEventSource.instances[0].send("live"));
  assert.equal(refreshes, 1, "a reconnect");
  act(() => FakeEventSource.instances[0].send("draftChanged", { draftId: "d1", accountId: "a1", status: "sent" }));
  assert.equal(refreshes, 2);
  act(() => FakeEventSource.instances[0].send("commentChanged", { eventId: "e1", accountId: "a1", outcome: "failed" }));
  assert.equal(refreshes, 2, "a message it was not given does nothing");
});

test("Reload makes the server read the page again", () => {
  render(
    <AppRouterContext.Provider value={router}>
      <ReloadButton className="x" />
    </AppRouterContext.Provider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Reload" }));
  assert.equal(refreshes, 1);
});
