import "@/test/dom";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "@/components/Toaster";

afterEach(cleanup);

function Buttons() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.success("Saved.")}>win</button>
      <button onClick={() => toast.error("It failed.")}>fail</button>
    </>
  );
}

const mount = () =>
  render(
    <ToastProvider>
      <Buttons />
    </ToastProvider>,
  );

test("a success is announced politely and goes away on its own, and an error stays until dismissed", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  mount();
  fireEvent.click(screen.getByText("win"));
  fireEvent.click(screen.getByText("fail"));
  assert.equal(screen.getByText("Saved.").closest("[role]")?.getAttribute("role"), "status");
  assert.equal(screen.getByText("It failed.").closest("[role]")?.getAttribute("role"), "alert");

  act(() => t.mock.timers.tick(10_000));
  assert.equal(screen.queryByText("Saved."), null, "the success went away");
  screen.getByText("It failed.");

  fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  assert.equal(screen.queryByText("It failed."), null);
});

test("only the latest few are shown, so a burst cannot cover the page", () => {
  mount();
  for (let i = 0; i < 8; i++) fireEvent.click(screen.getByText("fail"));
  assert.equal(screen.getAllByRole("alert").length, 5);
});

test("using a toast outside a provider is an error, not a message that goes nowhere", () => {
  const silence = console.error;
  console.error = () => {};
  try {
    assert.throws(() => render(<Buttons />), /outside a ToastProvider/);
  } finally {
    console.error = silence;
  }
});
