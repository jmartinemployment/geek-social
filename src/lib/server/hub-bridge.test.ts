import assert from "node:assert/strict";
import { test } from "node:test";
import { HubSignInError, httpStatusOf, retryDecision } from "@/lib/server/hub-bridge";

const outage = new Error("Failed to fetch");

test("a short outage is retried: the first attempts back off, then settle at 30 seconds", () => {
  const delays = [0, 1, 2, 3, 4, 5, 50, 5000].map((count) => retryDecision(count, outage));
  assert.deepEqual(
    delays,
    [0, 1000, 3000, 5000, 10000, 30000, 30000, 30000].map((delayMs) => ({ kind: "retry", delayMs })),
  );
});

test("an ended session stops the retries and says why", () => {
  const decision = retryDecision(0, new HubSignInError("Your sign-in has ended. Sign in again.", 401));
  assert.deepEqual(decision, { kind: "stop", reason: "Your sign-in has ended. Sign in again." });
});

test("GeekAPI refusing the hub's sign-in with 401 or 403 stops the retries", () => {
  const refused = (statusCode: number) => Object.assign(new Error(`HTTP ${statusCode}`), { statusCode });
  const unauthorized = retryDecision(2, refused(401));
  const forbidden = retryDecision(2, refused(403));
  assert.equal(unauthorized.kind, "stop");
  assert.match(unauthorized.kind === "stop" ? unauthorized.reason : "", /401/);
  assert.equal(forbidden.kind, "stop");
  assert.match(forbidden.kind === "stop" ? forbidden.reason : "", /geeksocial\.manage/);
});

test("a server error or a lost connection is not a verdict on the sign-in", () => {
  const serverError = Object.assign(new Error("HTTP 503"), { statusCode: 503 });
  assert.equal(retryDecision(1, serverError).kind, "retry");
  assert.equal(retryDecision(1, undefined).kind, "retry");
});

test("a refused negotiation is read from SignalR's wrapped message, because the wrapper carries no statusCode", () => {
  const wrapped = (status: string, text: string) =>
    new Error(`Failed to complete negotiation with the server: Error: ${text}: Status code '${status}'`);
  const unauthorized = retryDecision(0, wrapped("401", "Unauthorized"));
  const forbidden = retryDecision(0, wrapped("403", "Forbidden"));
  assert.equal(unauthorized.kind, "stop");
  assert.match(unauthorized.kind === "stop" ? unauthorized.reason : "", /401/);
  assert.equal(forbidden.kind, "stop");
  assert.match(forbidden.kind === "stop" ? forbidden.reason : "", /geeksocial\.manage/);
  assert.equal(retryDecision(0, wrapped("503", "Service Unavailable")).kind, "retry");
});

test("the status is read from the error when SignalR does carry it", () => {
  assert.equal(httpStatusOf(Object.assign(new Error("x"), { statusCode: 403 })), 403);
  assert.equal(httpStatusOf(new Error("no status here")), undefined);
  assert.equal(httpStatusOf(undefined), undefined);
});
