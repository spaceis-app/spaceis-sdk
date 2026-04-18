import { describe, it, expect, afterEach } from "vitest";
import { useState } from "react";
import { render, act, fireEvent, cleanup } from "@testing-library/react";
import { useFocusTrap } from "@/lib/use-focus-trap";

interface HarnessProps {
  initialOpen?: boolean;
}

function Harness({ initialOpen = false }: HarnessProps) {
  const [open, setOpen] = useState(initialOpen);
  const ref = useFocusTrap<HTMLDivElement>(open);

  return (
    <div>
      <button data-testid="trigger" onClick={() => setOpen(true)}>
        Open
      </button>
      <button data-testid="outside">Outside</button>

      {open && (
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          data-testid="dialog"
        >
          <button data-testid="first" onClick={() => setOpen(false)}>
            First
          </button>
          <button data-testid="middle">Middle</button>
          <button data-testid="last">Last</button>
        </div>
      )}
    </div>
  );
}

function flushFocusTimer() {
  // The hook defers the initial focus() via setTimeout(0); advance timers/microtasks.
  return act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
}

afterEach(() => {
  cleanup();
  (document.activeElement as HTMLElement | null)?.blur?.();
});

describe("useFocusTrap", () => {
  it("focuses the first focusable element when the trap activates", async () => {
    const { getByTestId } = render(<Harness />);
    const trigger = getByTestId("trigger");
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    await flushFocusTimer();

    expect(document.activeElement).toBe(getByTestId("first"));
  });

  it("cycles Tab from last back to first", async () => {
    const { getByTestId } = render(<Harness initialOpen />);
    await flushFocusTimer();

    const last = getByTestId("last");
    last.focus();
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(getByTestId("first"));
  });

  it("cycles Shift+Tab from first back to last", async () => {
    const { getByTestId } = render(<Harness initialOpen />);
    await flushFocusTimer();

    const first = getByTestId("first");
    first.focus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(getByTestId("last"));
  });

  it("does not intercept Tab in the middle of the list", async () => {
    const { getByTestId } = render(<Harness initialOpen />);
    await flushFocusTimer();

    const middle = getByTestId("middle");
    middle.focus();

    const event = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    const notPrevented = document.dispatchEvent(event);
    expect(notPrevented).toBe(true);
  });

  it("returns focus to the trigger when the trap deactivates", async () => {
    const { getByTestId } = render(<Harness />);
    const trigger = getByTestId("trigger");
    trigger.focus();

    fireEvent.click(trigger);
    await flushFocusTimer();

    // Close via the first button which flips state to closed
    fireEvent.click(getByTestId("first"));

    expect(document.activeElement).toBe(trigger);
  });

  it("is a no-op when isOpen is false", () => {
    const { getByTestId } = render(<Harness />);
    const outside = getByTestId("outside");
    outside.focus();
    expect(document.activeElement).toBe(outside);

    fireEvent.keyDown(document, { key: "Tab" });
    // No cycling logic ran; focus stays where it is
    expect(document.activeElement).toBe(outside);
  });
});
