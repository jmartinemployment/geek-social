// Checks, after `next build`, that the live-updates function carries every module SignalR loads at run
// time. It copies only the files the build traced for that function into an empty folder, as Vercel
// does, and builds a hub connection there, which runs each of those requires without any network call.
// On 2026-11-18 the deployed function failed "Cannot find module 'ws'" because tracing missed them.
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";

const root = process.cwd();
const routeDir = resolve(root, ".next/server/app/api/live-updates");
const trace = JSON.parse(readFileSync(join(routeDir, "route.js.nft.json"), "utf8"));

const target = mkdtempSync(join(tmpdir(), "live-updates-trace-"));
try {
  for (const file of trace.files) {
    const source = resolve(routeDir, file);
    const path = relative(root, source);
    if (!path.startsWith("node_modules/") || !statSync(source).isFile()) continue;
    const copy = join(target, path);
    mkdirSync(dirname(copy), { recursive: true });
    copyFileSync(source, copy);
  }

  const requireInTarget = createRequire(join(target, "check.cjs"));
  const signalr = requireInTarget("@microsoft/signalr");
  new signalr.HubConnectionBuilder()
    .withUrl("https://example.test/hubs/social-realtime", {
      transport: signalr.HttpTransportType.WebSockets,
      accessTokenFactory: () => "token",
    })
    .build();
  console.log("live-updates trace: every module SignalR loads at run time is in the function.");
} catch (error) {
  console.error(`live-updates trace: the deployed function would fail. ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  rmSync(target, { recursive: true, force: true });
}
