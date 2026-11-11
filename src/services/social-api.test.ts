import assert from "node:assert/strict";
import { test } from "node:test";
import { refusalFrom } from "@/services/social-api";

test("a GeekAPI failure keeps its sentence and code", () => {
  const err = refusalFrom(409, "Conflict", JSON.stringify({ error: "The draft is no longer pending.", code: "conflict" }));
  assert.equal(err.message, "The draft is no longer pending.");
  assert.equal(err.code, "conflict");
  assert.equal(err.status, 409);
  assert.deepEqual(err.violations, []);
});

test("a Reviewer refusal carries its violations", () => {
  const err = refusalFrom(
    422,
    "Unprocessable Entity",
    JSON.stringify({ error: "The text breaks: em_dash, unapproved_link.", code: "review_refused", violations: ["em_dash", "unapproved_link"] }),
  );
  assert.equal(err.code, "review_refused");
  assert.deepEqual(err.violations, ["em_dash", "unapproved_link"]);
});

test("a bare 403 says the scope is missing", () => {
  const err = refusalFrom(403, "Forbidden", "");
  assert.match(err.message, /geeksocial\.manage/);
});

test("plain text from the proxy is shown as it came", () => {
  const err = refusalFrom(502, "Bad Gateway", "Could not reach GeekAPI: fetch failed");
  assert.equal(err.message, "GeekAPI answered 502: Could not reach GeekAPI: fetch failed");
});
