import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useResource } from "@/lib/hooks/use-resource";

afterEach(cleanup);

/** A promise the test settles when it chooses, so it controls the order answers arrive in. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test("it is loading until the first answer, then holds the data", async () => {
  const answer = deferred<string[]>();
  const { result } = renderHook(() => useResource("pending", () => answer.promise));
  assert.equal(result.current.loading, true);
  assert.equal(result.current.data, null);
  await act(async () => answer.resolve(["a", "b"]));
  assert.equal(result.current.loading, false);
  assert.deepEqual(result.current.data, ["a", "b"]);
  assert.equal(result.current.error, null);
});

test("a failed load carries the error and clears the data, never an empty list", async () => {
  const { result } = renderHook(() => useResource("pending", () => Promise.reject(new Error("GeekAPI answered 503"))));
  await waitFor(() => assert.equal(result.current.loading, false));
  assert.equal(result.current.data, null);
  assert.match(result.current.error ?? "", /GeekAPI answered 503/);
});

test("a new key starts loading again, and the old key's answer is not shown for it", async () => {
  const answers = new Map([
    ["pending", deferred<string>()],
    ["sent", deferred<string>()],
  ]);
  const { result, rerender } = renderHook(({ key }) => useResource(key, () => answers.get(key)!.promise), {
    initialProps: { key: "pending" },
  });
  await act(async () => answers.get("pending")!.resolve("pending list"));
  assert.equal(result.current.data, "pending list");
  rerender({ key: "sent" });
  assert.equal(result.current.loading, true);
  assert.equal(result.current.data, null);
  await act(async () => answers.get("sent")!.resolve("sent list"));
  assert.equal(result.current.data, "sent list");
});

test("a reload keeps the current data on screen and says it is refreshing", async () => {
  const answers = [deferred<string>(), deferred<string>()];
  let call = 0;
  const { result } = renderHook(() => useResource("k", () => answers[call++].promise));
  await act(async () => answers[0].resolve("first"));
  act(() => result.current.reload());
  assert.equal(result.current.loading, false);
  assert.equal(result.current.refreshing, true);
  assert.equal(result.current.data, "first");
  await act(async () => answers[1].resolve("second"));
  assert.equal(result.current.refreshing, false);
  assert.equal(result.current.data, "second");
});

test("a burst of reloads while one load is running costs one more load, not one each", async () => {
  const answers = [deferred<string>(), deferred<string>(), deferred<string>()];
  let call = 0;
  const { result } = renderHook(() => useResource("k", () => answers[call++].promise));
  // Five live messages arrive while the first load is still in flight.
  act(() => {
    for (let i = 0; i < 5; i++) result.current.reload();
  });
  assert.equal(call, 1, "nothing started a second load yet");
  await act(async () => answers[0].resolve("first"));
  assert.equal(call, 2, "the burst became exactly one more load");
  await act(async () => answers[1].resolve("second"));
  assert.equal(call, 2);
  assert.equal(result.current.data, "second");
});

test("a live edit made while a load is running is not overwritten by that load's older answer", async () => {
  const answers = [deferred<string[]>(), deferred<string[]>(), deferred<string[]>()];
  let call = 0;
  const { result } = renderHook(() => useResource("k", () => answers[call++].promise));
  await act(async () => answers[0].resolve(["a", "b"]));

  act(() => result.current.reload());
  // The reload read the server before this edit, so its answer lacks the edit.
  act(() => result.current.setData((current) => current.filter((item) => item !== "a")));
  assert.deepEqual(result.current.data, ["b"], "the edit shows at once");

  await act(async () => answers[1].resolve(["a", "b"]));
  assert.equal(call, 3, "the stale answer is followed by one more load rather than trusted");
  await act(async () => answers[2].resolve(["b"]));
  assert.deepEqual(result.current.data, ["b"]);
});

test("an edit with no load running does not cause another load", async () => {
  let call = 0;
  const { result } = renderHook(() =>
    useResource("k", () => {
      call++;
      return Promise.resolve(["a", "b"]);
    }),
  );
  await waitFor(() => assert.equal(result.current.loading, false));
  act(() => result.current.setData((current) => [...current, "c"]));
  assert.deepEqual(result.current.data, ["a", "b", "c"]);
  assert.equal(call, 1);
});

test("an edit before anything has loaded changes nothing", async () => {
  const answer = deferred<string[]>();
  const { result } = renderHook(() => useResource("k", () => answer.promise));
  act(() => result.current.setData((current) => [...current, "x"]));
  assert.equal(result.current.data, null);
  await act(async () => answer.resolve(["a"]));
  assert.deepEqual(result.current.data, ["a"]);
});
