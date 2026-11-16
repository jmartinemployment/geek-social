import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

/**
 * Standing rules for this repo's source, checked on every test run:
 * no em dash in UI text or comments, live updates only over the one stream (no polling timers, no raw
 * sockets, and a raw EventSource only in the one file that opens that stream), and nothing kept in
 * browser storage, and no form that posts the page back (a form's action is a Server Action, never an address
 * or a method, so no write reloads the page).
 */

const root = join(process.cwd(), "src");
const self = join(root, "test", "source-rules.test.ts");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx|css)$/.test(name) ? [path] : [];
  });
}

const sources = files(root)
  .filter((path) => path !== self)
  .map((path) => ({ path: relative(process.cwd(), path), text: readFileSync(path, "utf8") }));

const EM_DASH = String.fromCharCode(0x2014);

function offenders(pattern: RegExp | string): string[] {
  return sources
    .filter(({ text }) => (typeof pattern === "string" ? text.includes(pattern) : pattern.test(text)))
    .map(({ path }) => path);
}

test("no em dash anywhere in the source", () => {
  assert.deepEqual(offenders(EM_DASH), []);
});

test("nothing polls on a timer", () => {
  assert.deepEqual(offenders(/\bsetInterval\s*\(/), []);
});

test("no raw WebSocket anywhere, and a raw EventSource only in the live stream client", () => {
  assert.deepEqual(offenders(/new\s+WebSocket\s*\(/), []);
  assert.deepEqual(offenders(/new\s+EventSource\s*\(/), ["src/services/live-stream.ts"]);
});

test("nothing is kept in browser storage", () => {
  assert.deepEqual(offenders(/\b(localStorage|sessionStorage|indexedDB)\b/), []);
});

test("no form posts the page back: a <form> has no method and no address as its action, only a function", () => {
  assert.deepEqual(offenders(/<form\b[^>]*\bmethod\s*=/), []);
  assert.deepEqual(offenders(/<form\b[^>]*\baction\s*=\s*["']/), []);
});
