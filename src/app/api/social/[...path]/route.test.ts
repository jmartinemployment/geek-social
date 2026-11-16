import "@/test/set-env";
import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";

const APP = "http://localhost:3006";

async function post(headers: Record<string, string>) {
  const { POST } = await import("./route");
  return POST(new NextRequest(`${APP}/api/social/drafts/d1/approve`, { method: "POST", headers }), {
    params: Promise.resolve({ path: ["drafts", "d1", "approve"] }),
  });
}

test("a write from another origin is refused before it reaches GeekAPI, with the reason", async () => {
  const res = await post({ origin: "https://evil.example" });
  assert.equal(res.status, 403);
  assert.match(((await res.json()) as { error: string }).error, /did not come from this app's own pages/);
});

test("a write that says nothing about where it came from is refused too", async () => {
  const res = await post({});
  assert.equal(res.status, 403);
});
