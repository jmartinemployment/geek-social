import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Time } from "@/components/Time";
import { formatTime, formatTimeUtc } from "@/components/ui-helpers";

afterEach(cleanup);

const iso = "2026-11-16T12:30:00Z";

test("the server says the time in UTC and names it, because it does not know the viewer's zone", () => {
  const html = renderToString(<Time value={iso} />);
  assert.match(html, /UTC/);
  assert.match(html, /30/);
  assert.equal(formatTimeUtc(iso).endsWith("UTC"), true);
});

test("the browser says the time in the viewer's own zone, in the same element", () => {
  const { container } = render(<Time value={iso} />);
  const element = container.querySelector("time");
  assert.equal(element?.textContent, formatTime(iso));
  assert.equal(element?.getAttribute("datetime"), iso);
});

test("a missing time is empty and one that does not parse is shown as it came, never a made-up date", () => {
  assert.equal(formatTimeUtc(null), "");
  assert.equal(formatTimeUtc("not a time"), "not a time");
  assert.equal(formatTime(undefined), "");
  assert.equal(formatTime("not a time"), "not a time");
});
