import assert from "node:assert/strict";
import { test } from "node:test";
import robots from "@/app/robots";

test("robots.txt disallows every crawler from every path", () => {
  assert.deepEqual(robots(), { rules: { userAgent: "*", disallow: "/" } });
});
