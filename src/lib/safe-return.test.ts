import assert from "node:assert/strict";
import { test } from "node:test";
import { safeReturnTo } from "@/lib/safe-return";

test("a path inside the app is kept, with its query", () => {
  assert.equal(safeReturnTo("/posts?tab=held"), "/posts?tab=held");
  assert.equal(safeReturnTo("/"), "/");
});

test("nothing, or an empty value, is the home page", () => {
  assert.equal(safeReturnTo(null), "/");
  assert.equal(safeReturnTo(undefined), "/");
  assert.equal(safeReturnTo(""), "/");
});

test("an address that would leave the app becomes the home page", () => {
  for (const value of [
    "https://evil.example/x",
    "//evil.example/x",
    "/\\evil.example",
    "javascript:alert(1)",
    "posts",
    "/ok\r\nSet-Cookie: a=b",
    `/${"a".repeat(3000)}`,
  ]) {
    assert.equal(safeReturnTo(value), "/", value.slice(0, 30));
  }
});

test("a path back into the sign-in routes would loop, so it becomes the home page", () => {
  assert.equal(safeReturnTo("/api/auth/login"), "/");
  assert.equal(safeReturnTo("/api/auth/callback?code=x"), "/");
});
