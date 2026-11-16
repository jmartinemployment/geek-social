import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, render, screen } from "@testing-library/react";
import { SocialHubProvider, useHubEvent, useSocialHub } from "@/components/SocialHubProvider";
import { FakeEventSource, installFakeEventSource } from "@/test/fake-event-source";

beforeEach(() => installFakeEventSource());
afterEach(cleanup);

let heard: string[];

function Probe() {
  const { state, reconnect } = useSocialHub();
  useHubEvent("draftChanged", (body) => heard.push(`draftChanged ${JSON.stringify(body)}`));
  useHubEvent("resync", () => heard.push("resync"));
  const detail = state.kind === "reconnecting" ? (state.reason ?? "none") : state.kind === "off" ? state.reason : "";
  return (
    <div>
      <p data-testid="state">{`${state.kind}:${detail}`}</p>
      <button type="button" onClick={reconnect}>
        reconnect
      </button>
    </div>
  );
}

function mount() {
  heard = [];
  const view = render(
    <SocialHubProvider>
      <Probe />
    </SocialHubProvider>,
  );
  const state = () => screen.getByTestId("state").textContent;
  const stream = (index = 0) => FakeEventSource.instances[index];
  return { ...view, state, stream };
}

test("it opens one stream and is connecting until the server says it is live", () => {
  const { state } = mount();
  assert.equal(FakeEventSource.instances.length, 1);
  assert.equal(state(), "connecting:");
});

test("live makes the screen live and tells every page to read again", () => {
  const { state, stream } = mount();
  act(() => stream().send("live"));
  assert.equal(state(), "live:");
  assert.deepEqual(heard, ["resync"]);
  act(() => stream().send("live"));
  assert.deepEqual(heard, ["resync", "resync"], "every reconnect reads again, not only the first connect");
});

test("hub messages reach the pages that listen for them", () => {
  const { stream } = mount();
  act(() => stream().send("draftChanged", { draftId: "d1", accountId: "a1", status: "sent" }));
  assert.deepEqual(heard, ['draftChanged {"draftId":"d1","accountId":"a1","status":"sent"}']);
});

test("a drop shows the banner state with its reason, and a reason-less drop is still a drop", () => {
  const { state, stream } = mount();
  act(() => stream().send("live"));
  act(() => stream().send("reconnecting", { reason: "Failed to fetch" }));
  assert.equal(state(), "reconnecting:Failed to fetch");
  act(() => stream().fail(FakeEventSource.CONNECTING));
  assert.equal(state(), "reconnecting:none");
});

test("a refusal that retrying cannot fix turns the screen off with the reason", () => {
  const { state, stream } = mount();
  act(() => stream().send("off", { reason: "GeekAPI refused the live connection's sign-in (401). Sign in again." }));
  assert.equal(state(), "off:GeekAPI refused the live connection's sign-in (401). Sign in again.");
  assert.equal(stream().closed, true);
});

test("Reconnect closes the old stream and opens a new one", () => {
  const { state, stream } = mount();
  act(() => stream().send("off", { reason: "refused" }));
  act(() => screen.getByRole("button", { name: "reconnect" }).click());
  assert.equal(state(), "connecting:");
  assert.equal(FakeEventSource.instances.length, 2);
  assert.equal(stream(0).closed, true);
  act(() => stream(1).send("live"));
  assert.equal(state(), "live:");
});

test("what a closed stream reports afterwards is ignored", () => {
  const { stream, unmount } = mount();
  act(() => stream().send("live"));
  unmount();
  assert.equal(stream().closed, true, "unmounting closes the stream");
  const before = heard.length;
  assert.doesNotThrow(() => stream().send("draftChanged", { draftId: "d2" }));
  assert.equal(heard.length, before);
});
