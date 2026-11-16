import assert from "node:assert/strict";
import { test } from "node:test";
import { isSameOriginWrite } from "@/lib/same-origin";

const APP = "https://geek-social.geekatyourspot.com";

function request(method: string, headers: Record<string, string> = {}) {
  return new Request(`${APP}/api/social/drafts`, { method, headers });
}

test("reads are never checked", () => {
  assert.equal(isSameOriginWrite(request("GET"), APP), true);
  assert.equal(isSameOriginWrite(request("HEAD", { origin: "https://evil.example" }), APP), true);
  assert.equal(isSameOriginWrite(request("OPTIONS"), APP), true);
});

test("a write from this app's own origin is allowed", () => {
  for (const method of ["POST", "PUT", "DELETE", "PATCH"]) {
    assert.equal(isSameOriginWrite(request(method, { origin: APP }), APP), true, method);
  }
});

test("a write from another origin is refused, whatever else it says", () => {
  assert.equal(isSameOriginWrite(request("POST", { origin: "https://evil.example" }), APP), false);
  assert.equal(
    isSameOriginWrite(request("POST", { origin: "https://evil.example", "sec-fetch-site": "same-origin" }), APP),
    false,
    "a wrong Origin is not rescued by the fetch-metadata header",
  );
  assert.equal(isSameOriginWrite(request("POST", { origin: "null" }), APP), false);
  assert.equal(isSameOriginWrite(request("POST", { origin: `${APP}.evil.example` }), APP), false);
});

test("a write with no Origin is allowed only when the browser says it is same-origin", () => {
  assert.equal(isSameOriginWrite(request("DELETE", { "sec-fetch-site": "same-origin" }), APP), true);
  assert.equal(isSameOriginWrite(request("DELETE", { "sec-fetch-site": "cross-site" }), APP), false);
  assert.equal(isSameOriginWrite(request("DELETE", { "sec-fetch-site": "same-site" }), APP), false);
  assert.equal(isSameOriginWrite(request("DELETE"), APP), false, "no evidence either way is a refusal");
});
