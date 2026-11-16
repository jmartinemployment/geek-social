import assert from "node:assert/strict";
import { test } from "node:test";
import { run, unwrap } from "@/lib/social/action-result";
import { SocialApiError } from "@/services/social-api";

test("a value crosses as a value and comes back as the value", async () => {
  assert.equal(unwrap(await run(async () => 7)), 7);
});

test("GeekAPI's refusal crosses as data and comes back as the same error, with its code and broken rules", async () => {
  const result = await run(async () => {
    throw new SocialApiError("The text breaks: em_dash.", 422, "review_refused", ["em_dash"]);
  });
  assert.deepEqual(result, { ok: false, error: "The text breaks: em_dash.", status: 422, code: "review_refused", violations: ["em_dash"] });

  assert.throws(
    () => unwrap(result),
    (err: unknown) =>
      err instanceof SocialApiError && err.status === 422 && err.code === "review_refused" && err.violations[0] === "em_dash",
  );
});

test("a failure that is not GeekAPI's answer is not turned into a result: it reaches Next.js and the error page", async () => {
  await assert.rejects(run(async () => {
    throw new Error("a bug");
  }), /a bug/);
});

test("an answer that could not be read keeps its status, so the card still knows the action may have happened", async () => {
  const result = await run(async () => {
    throw new SocialApiError("GeekAPI answered the approve without a send outcome.", 200, null, []);
  });
  assert.throws(() => unwrap(result), (err: unknown) => err instanceof SocialApiError && err.status === 200 && err.code === null);
});
