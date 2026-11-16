import assert from "node:assert/strict";
import { test } from "node:test";
import { failureText, readTenantResponse } from "@/lib/social/tenant";

const tenant = { id: "t1", ownerUserId: "u1", name: "Acme", aiConsentAcceptedAt: null, createdAt: "2026-11-16T12:00:00Z" };

test("a 200 is the tenant", async () => {
  assert.deepEqual(await readTenantResponse(Response.json(tenant)), tenant);
});

test("a 404 that says not_found is a person who has not signed up", async () => {
  assert.equal(await readTenantResponse(Response.json({ error: "No tenant for this person.", code: "not_found" }, { status: 404 })), null);
});

test("a 404 that does not say not_found is a missing route, thrown and never read as not signed up", async () => {
  await assert.rejects(readTenantResponse(new Response("", { status: 404 })), /GeekAPI answered 404/);
  await assert.rejects(readTenantResponse(Response.json({ error: "x", code: "something_else" }, { status: 404 })));
});

test("every other failure is thrown with GeekAPI's own sentence", async () => {
  await assert.rejects(readTenantResponse(Response.json({ error: "The social store failed.", code: "store_unavailable" }, { status: 503 })), /The social store failed\./);
  await assert.rejects(readTenantResponse(Response.json({ error: "no", code: "forbidden" }, { status: 403 })), /no/);
});

test("a failure with no readable body still says what answered", async () => {
  assert.equal(await failureText(new Response("<html>", { status: 502 }), "It broke."), "It broke. (GeekAPI answered 502.)");
});
