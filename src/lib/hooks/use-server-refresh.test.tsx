import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, renderHook } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactNode } from "react";
import { useServerRefresh } from "@/lib/hooks/use-server-refresh";

/** Each router.refresh() hands back a promise the test settles, which keeps that refresh's transition pending. */
let reads: Array<() => void>;
const router = {
  refresh: () => new Promise<void>((resolve) => reads.push(resolve)),
} as never;

function wrapper({ children }: { children: ReactNode }) {
  return <AppRouterContext.Provider value={router}>{children}</AppRouterContext.Provider>;
}

beforeEach(() => {
  reads = [];
});
afterEach(cleanup);

/** Lets a running refresh finish and React settle what that sets off. */
async function finishRead(index: number) {
  await act(async () => {
    reads[index]();
  });
}

test("a refresh while the page is idle reads once and reports that it is refreshing until the read ends", async () => {
  const { result } = renderHook(() => useServerRefresh(), { wrapper });
  assert.equal(result.current.refreshing, false);

  await act(async () => result.current.refresh());
  assert.equal(reads.length, 1);
  assert.equal(result.current.refreshing, true);

  await finishRead(0);
  assert.equal(result.current.refreshing, false);
  assert.equal(reads.length, 1, "nothing was asked for while it ran, so nothing runs after it");
});

test("a burst while a read is running is not sent then: it becomes one more read when that one ends", async () => {
  const { result } = renderHook(() => useServerRefresh(), { wrapper });

  await act(async () => result.current.refresh());
  assert.equal(reads.length, 1);

  await act(async () => {
    for (let i = 0; i < 5; i++) result.current.refresh();
  });
  assert.equal(reads.length, 1, "five live messages during a read send no read of their own");

  await finishRead(0);
  assert.equal(reads.length, 2, "the burst is answered by exactly one more read");
  assert.equal(result.current.refreshing, true);

  await finishRead(1);
  assert.equal(reads.length, 2, "the follow-up read was the last one: nothing was asked for during it");
  assert.equal(result.current.refreshing, false);
});

test("a request that arrives during the follow-up read gets another, so the page ends on what the last request saw", async () => {
  const { result } = renderHook(() => useServerRefresh(), { wrapper });

  await act(async () => result.current.refresh());
  await act(async () => result.current.refresh());
  await finishRead(0);
  assert.equal(reads.length, 2);

  await act(async () => result.current.refresh());
  assert.equal(reads.length, 2, "the follow-up is running, so this waits too");

  await finishRead(1);
  assert.equal(reads.length, 3);

  await finishRead(2);
  assert.equal(reads.length, 3);
  assert.equal(result.current.refreshing, false);
});

test("after a burst has been answered, the next request reads at once", async () => {
  const { result } = renderHook(() => useServerRefresh(), { wrapper });

  await act(async () => result.current.refresh());
  await act(async () => result.current.refresh());
  await finishRead(0);
  await finishRead(1);
  assert.equal(reads.length, 2);

  await act(async () => result.current.refresh());
  assert.equal(reads.length, 3, "an idle page is not made to wait");
});
