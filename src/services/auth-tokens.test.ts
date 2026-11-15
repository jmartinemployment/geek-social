import assert from "node:assert/strict";
import { test } from "node:test";
import { isSessionDeadResponse } from "@/services/auth-tokens";

test("a spent or revoked refresh token ends the session", () => {
  assert.equal(isSessionDeadResponse('{"error":"invalid_grant","error_description":"The token is no longer valid."}'), true);
  assert.equal(isSessionDeadResponse("invalid_token"), true);
});

test("a GeekOAuth failure that is not a verdict on the token does not end the session", () => {
  assert.equal(isSessionDeadResponse(""), false);
  assert.equal(isSessionDeadResponse("upstream connect error or disconnect/reset before headers"), false);
  assert.equal(isSessionDeadResponse('{"error":"server_error"}'), false);
});
