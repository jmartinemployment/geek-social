import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FAILURE_WORDS,
  REVIEW_RULE_WORDS,
  failureWords,
  ruleWords,
} from "@/lib/social/words";

// SocialFailureCodes.All in GeekApplication/Models/Social/SocialPlatforms.cs, plus review_refused.
const FAILURE_CODES = [
  "not_supported", "invalid_request", "token_invalid", "rate_limited", "forbidden", "not_found",
  "platform_rejected", "platform_unavailable", "outcome_unknown", "invalid_signature", "conflict",
  "store_unavailable", "encryption_unavailable", "not_configured", "clearance_required", "model_failed",
  "review_refused",
];

// ReviewRules.All in GeekApplication/Models/Social/SocialAgents.cs.
const REVIEW_RULES = ["em_dash", "smb", "home_address", "phone_number", "email_address", "unapproved_link", "too_long"];

test("every failure code GeekSocial sends has plain words", () => {
  assert.deepEqual(Object.keys(FAILURE_WORDS).sort(), [...FAILURE_CODES].sort());
});

test("every Reviewer rule has plain words", () => {
  assert.deepEqual(Object.keys(REVIEW_RULE_WORDS).sort(), [...REVIEW_RULES].sort());
});

test("an unknown value is named, not hidden", () => {
  assert.equal(failureWords("brand_new_code"), 'Unrecognised failure code "brand_new_code"');
  assert.equal(ruleWords("new_rule"), 'Unrecognised Reviewer rule "new_rule"');
  assert.equal(failureWords("toString"), 'Unrecognised failure code "toString"');
});
