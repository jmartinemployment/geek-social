import assert from "node:assert/strict";
import { test } from "node:test";
import { HubSignInError, createHubBridge, httpStatusOf, retryDecision } from "@/lib/server/hub-bridge";

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

/** A stand-in for GeekAPI's hub: the SignalR negotiate answer, the JSON handshake, and pushes. */
async function startFakeHub() {
  const { createServer } = await import("node:http");
  const { WebSocketServer } = await import("ws");
  const seen: { negotiateAuthorization?: string; upgradeAuthorization?: string; upgradeUrl?: string; negotiates: number; polls: number } = { negotiates: 0, polls: 0 };
  const sockets = new Set<import("ws").WebSocket>();
  const server = createServer((req, res) => {
    if (req.method === "POST" && req.url?.startsWith("/hubs/social-realtime/negotiate")) {
      seen.negotiates++;
      seen.negotiateAuthorization = req.headers.authorization;
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          negotiateVersion: 1,
          connectionId: "c1",
          connectionToken: "t1",
          availableTransports: [
            { transport: "WebSockets", transferFormats: ["Text", "Binary"] },
            { transport: "LongPolling", transferFormats: ["Text", "Binary"] },
          ],
        }),
      );
      return;
    }
    if (req.url?.startsWith("/hubs/social-realtime")) seen.polls++;
    res.statusCode = 404;
    res.end();
  });
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (req, socket, head) => {
    seen.upgradeAuthorization = req.headers.authorization;
    seen.upgradeUrl = req.url;
    wss.handleUpgrade(req, socket, head, (ws) => {
      sockets.add(ws);
      ws.on("message", (data) => {
        if (String(data).includes('"protocol"')) ws.send("{}\u001e");
      });
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as import("node:net").AddressInfo;
  return {
    seen,
    url: `http://127.0.0.1:${port}/hubs/social-realtime`,
    push: (target: string, body: unknown) => {
      for (const ws of sockets) ws.send(JSON.stringify({ type: 1, target, arguments: [body] }) + "\u001e");
    },
    close: async () => {
      for (const ws of sockets) ws.terminate();
      wss.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

test("the bridge connects over WebSockets, sends the token in a header and receives a hub push", async () => {
  const hub = await startFakeHub();
  const connection = createHubBridge(() => "the-access-token", { onAttemptFailed: () => {}, onGiveUp: () => {} }, hub.url);
  try {
    const received = new Promise<unknown>((resolve) => connection.on("draftChanged", resolve));
    await connection.start();
    hub.push("draftChanged", { draftId: "d1", accountId: "a1", status: "pending" });
    assert.deepEqual(await received, { draftId: "d1", accountId: "a1", status: "pending" });
    assert.equal(hub.seen.negotiateAuthorization, "Bearer the-access-token");
    assert.equal(hub.seen.upgradeAuthorization, "Bearer the-access-token", "the upgrade carries the token in a header");
    assert.equal(hub.seen.upgradeUrl?.includes("access_token"), false, "the token is not in the URL");
    assert.equal(hub.seen.polls, 0, "nothing polled");
  } finally {
    await connection.stop();
    await hub.close();
  }
});
