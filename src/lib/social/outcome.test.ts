import assert from "node:assert/strict";
import { test } from "node:test";
import { mayHaveHappened } from "@/lib/social/outcome";
import { SocialApiError } from "@/services/social-api";

const refusal = (status: number, code: string | null) => new SocialApiError("x", status, code, []);

test("a write the platform may have applied is uncertain", () => {
  assert.equal(mayHaveHappened(refusal(503, "outcome_unknown")), true);
});

test("no answer at all, or an unreadable one, is uncertain", () => {
  assert.equal(mayHaveHappened(refusal(0, null)), true);
  assert.equal(mayHaveHappened(refusal(502, null)), true);
  assert.equal(mayHaveHappened(refusal(504, null)), true);
  assert.equal(mayHaveHappened(refusal(200, null)), true);
});

test("a refusal GeekAPI gave a code for is definite: nothing was done", () => {
  for (const [status, code] of [[422, "review_refused"], [409, "conflict"], [503, "not_configured"], [400, "invalid_request"]] as const) {
    assert.equal(mayHaveHappened(refusal(status, code)), false);
  }
});

test("a 4xx with no code is a plain refusal, and a non-API error is not an API outcome", () => {
  assert.equal(mayHaveHappened(refusal(403, null)), false);
  assert.equal(mayHaveHappened(new Error("boom")), false);
});
