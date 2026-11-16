import assert from "node:assert/strict";
import { test } from "node:test";
import { formatEvent, formatRetry, readReason } from "@/lib/live-protocol";

test("an event is one named block ending in a blank line, with its data on one line", () => {
  assert.equal(formatEvent("draftChanged", { id: "d1", note: "two\nlines" }), 'event: draftChanged\ndata: {"id":"d1","note":"two\\nlines"}\n\n');
});

test("the reconnect delay is announced as a retry field", () => {
  assert.equal(formatRetry(3000), "retry: 3000\n\n");
});

test("a reason is read from control data, and anything else is not mistaken for one", () => {
  assert.equal(readReason('{"reason":"GeekAPI refused (401)"}'), "GeekAPI refused (401)");
  assert.equal(readReason('{"reason":null}'), null);
  assert.equal(readReason("{}"), null);
  assert.equal(readReason("not json"), null);
  assert.equal(readReason("42"), null);
});
