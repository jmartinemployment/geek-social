import assert from "node:assert/strict";
import { test } from "node:test";
import { reconnectDelay } from "@/services/social-hub";

test("the first reconnect attempts back off, then settle at 30 seconds", () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(reconnectDelay), [0, 1000, 3000, 5000, 10000]);
  assert.equal(reconnectDelay(5), 30000);
});

test("the connection never stops trying", () => {
  for (const count of [5, 50, 5000]) assert.equal(reconnectDelay(count), 30000);
});
