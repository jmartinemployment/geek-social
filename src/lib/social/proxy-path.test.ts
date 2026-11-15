import assert from "node:assert/strict";
import { test } from "node:test";
import { socialTargetPath } from "@/lib/social/proxy-path";

const BASE = "https://api.example.test";

test("segments are encoded and stay under api/social", () => {
  assert.equal(socialTargetPath(["drafts", "a b", "approve"]), "/api/social/drafts/a%20b/approve");
  assert.equal(new URL(socialTargetPath(["drafts", "x?y"]), BASE).pathname, "/api/social/drafts/x%3Fy");
});

test("a dot segment is refused, because new URL would collapse it out of api/social", () => {
  assert.equal(new URL("/api/social/../health", BASE).pathname, "/api/health");
  assert.throws(() => socialTargetPath(["..", "health"]), /not a valid GeekSocial route segment/);
  assert.throws(() => socialTargetPath(["drafts", "."]), /not a valid GeekSocial route segment/);
});

test("an empty path or an empty segment is refused", () => {
  assert.throws(() => socialTargetPath([]), /route is needed/);
  assert.throws(() => socialTargetPath(["drafts", ""]), /not a valid GeekSocial route segment/);
});
