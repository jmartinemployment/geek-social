import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { FakeEventSource, installFakeEventSource } from "@/test/fake-event-source";
import { openLiveStream, type LiveStreamHandlers } from "@/services/live-stream";

const realFetch = globalThis.fetch;
let source: FakeEventSource;
let log: string[];

function handlers(): LiveStreamHandlers {
  return {
    onLive: () => log.push("live"),
    onMessage: (name, body) => log.push(`message ${name} ${JSON.stringify(body)}`),
    onReconnecting: (reason) => log.push(`reconnecting ${reason}`),
    onOff: (reason) => log.push(`off ${reason}`),
  };
}

beforeEach(() => {
  installFakeEventSource();
  log = [];
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

function open() {
  const close = openLiveStream(handlers());
  source = FakeEventSource.instances[0];
  return close;
}

/** Lets the probe's promise chain finish. */
const settle = () => new Promise((resolve) => setImmediate(resolve));

test("it opens this app's own stream, which carries no token", () => {
  open();
  assert.equal(source.url, "/api/live-updates");
});

test("the server's live event and each hub message reach the handlers", () => {
  open();
  source.send("live");
  source.send("draftChanged", { id: "d1", state: "pending" });
  source.send("commentChanged", { id: "c1" });
  source.send("accountChanged", { id: "a1" });
  assert.deepEqual(log, [
    "live",
    'message draftChanged {"id":"d1","state":"pending"}',
    'message commentChanged {"id":"c1"}',
    'message accountChanged {"id":"a1"}',
  ]);
});

test("a hub message that is not JSON stops the stream and says so, instead of being dropped", () => {
  open();
  source.send("draftChanged", "{not json");
  assert.equal(source.closed, true);
  assert.equal(log.length, 1);
  assert.match(log[0], /^off The live stream sent a draftChanged message that could not be read/);
});

test("a reconnecting event carries the server's reason", () => {
  open();
  source.send("reconnecting", { reason: "Failed to fetch" });
  source.send("reconnecting", { reason: null });
  assert.deepEqual(log, ["reconnecting Failed to fetch", "reconnecting null"]);
});

test("an off event stops the stream for good, with the server's reason", () => {
  open();
  source.send("off", { reason: "GeekAPI refused the live connection's sign-in (401). Sign in again." });
  assert.equal(source.closed, true);
  assert.deepEqual(log, ["off GeekAPI refused the live connection's sign-in (401). Sign in again."]);
});

test("an off event with no readable reason still says it was refused", () => {
  open();
  source.send("off", "garbage");
  assert.deepEqual(log, ["off The live connection was refused."]);
});

test("a dropped stream that the browser is reopening is reported as reconnecting", () => {
  open();
  source.fail(FakeEventSource.CONNECTING);
  assert.deepEqual(log, ["reconnecting null"]);
});

test("a scheduled end is not reported as a drop, and the next real drop is", () => {
  open();
  source.send("renew");
  source.fail(FakeEventSource.CONNECTING);
  assert.deepEqual(log, [], "the planned reopening is silent");
  source.send("open");
  source.fail(FakeEventSource.CONNECTING);
  assert.deepEqual(log, ["reconnecting null"], "after the new stream opens, a drop is a drop");
});

test("a refused stream is explained by asking the server why", async () => {
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    assert.equal((init?.headers as Record<string, string>)["x-live-probe"], "1");
    return new Response(JSON.stringify({ error: "Your sign-in has ended. Sign in again." }), { status: 401 });
  }) as typeof fetch;
  open();
  source.fail(FakeEventSource.CLOSED);
  await settle();
  assert.equal(source.closed, true);
  assert.deepEqual(log, ["off Your sign-in has ended. Sign in again."]);
});

test("a refusal with no JSON message is reported with its status", async () => {
  globalThis.fetch = (async () => new Response("<html>Bad gateway</html>", { status: 502 })) as typeof fetch;
  open();
  source.fail(FakeEventSource.CLOSED);
  await settle();
  assert.deepEqual(log, ["off The live stream was refused (502)."]);
});

test("a refusal when this app's server cannot be reached says that", async () => {
  globalThis.fetch = (async () => {
    throw new TypeError("fetch failed");
  }) as typeof fetch;
  open();
  source.fail(FakeEventSource.CLOSED);
  await settle();
  assert.deepEqual(log, ["off The live stream could not reach this app's server: fetch failed"]);
});

test("a closed stream whose probe answers normally says it closed unexpectedly", async () => {
  globalThis.fetch = (async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as typeof fetch;
  open();
  source.fail(FakeEventSource.CLOSED);
  await settle();
  assert.deepEqual(log, ["off The live stream closed unexpectedly. Reconnect to try again."]);
});

test("closing the stream silences anything it reports afterwards", () => {
  const close = open();
  close();
  assert.equal(source.closed, true);
  source.fail(FakeEventSource.CONNECTING);
  source.fail(FakeEventSource.CLOSED);
  assert.deepEqual(log, []);
});

test("after an off event, the close that follows is not reported a second time", async () => {
  globalThis.fetch = (async () => {
    throw new Error("the probe must not run after an off event");
  }) as typeof fetch;
  open();
  source.send("off", { reason: "refused" });
  source.fail(FakeEventSource.CLOSED);
  await settle();
  assert.deepEqual(log, ["off refused"]);
});
