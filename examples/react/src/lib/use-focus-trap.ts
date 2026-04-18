"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Trap Tab focus inside a container while `isOpen` is true and return focus
 * to whatever element was focused when the trap activated once it closes.
 *
 * Usage:
 * ```tsx
 * const trapRef = useFocusTrap<HTMLDivElement>(isOpen);
 * return <div ref={trapRef} role="dialog" aria-modal="true">…</div>;
 * ```
 */
export function useFocusTrap<T extends HTMLElement>(isOpen: boolean) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;
    const container = containerRef.current;
    if (!container) return;

    const trigger = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute("disabled"));

    // Defer to next tick so the drawer is visible before we move focus
    const focusTimer = window.setTimeout(() => {
      const items = getFocusable();
      if (items.length > 0) items[0].focus();
    }, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      if (trigger && typeof trigger.focus === "function") {
        trigger.focus();
      }
    };
  }, [isOpen]);

  return containerRef;
}
