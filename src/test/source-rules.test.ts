import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

/**
 * Standing rules for this repo's source, checked on every test run:
 * no em dash in UI text or comments, live updates by SignalR only (no timers, no raw sockets,
 * no server-sent events), and nothing kept in browser storage.
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

test("no raw WebSocket or EventSource: live updates come over SignalR only", () => {
  assert.deepEqual(offenders(/new\s+(WebSocket|EventSource)\s*\(/), []);
});

test("nothing is kept in browser storage", () => {
  assert.deepEqual(offenders(/\b(localStorage|sessionStorage|indexedDB)\b/), []);
});
