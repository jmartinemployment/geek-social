import assert from "node:assert/strict";
import { test } from "node:test";
import { apiUrl } from "@/lib/api-url";

test("a path is resolved on GeekAPI", () => {
  assert.equal(apiUrl("/api/social/drafts?accountId=1").href, "https://api.geekatyourspot.com/api/social/drafts?accountId=1");
});

test("an absolute address on GeekAPI's own origin is accepted", () => {
  assert.equal(apiUrl(new URL("https://api.geekatyourspot.com/api/social/posts")).pathname, "/api/social/posts");
});

test("another origin is refused, so the sign-in is never sent anywhere else", () => {
  assert.throws(() => apiUrl("https://evil.example/api/social/drafts"), /only sent to https:\/\/api\.geekatyourspot\.com/);
  assert.throws(() => apiUrl("//evil.example/x"), /only sent to/);
});
