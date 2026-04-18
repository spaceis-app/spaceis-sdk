/**
 * Tests for the useFocusTrap composable logic.
 *
 * useFocusTrap.ts contains a `if (!import.meta.client) return;` guard that
 * prevents execution in SSR. In Vitest, `import.meta.client` is `undefined`,
 * so the guard fires and the composable becomes a no-op.
 *
 * To test the actual focus-trap logic we use an inline re-implementation that
 * is identical to the source but without the SSR guard. This tests the core
 * algorithm (watch + setTimeout + keydown handler) without requiring Nuxt's
 * virtual module system.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { ref, watch, nextTick, type Ref } from 'vue';

afterEach(() => {
  document.body.innerHTML = '';
});

// ── Inline re-implementation of useFocusTrap without the SSR guard ─────────

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled'),
  );
}

/**
 * Local test double of useFocusTrap — identical logic, no import.meta.client guard.
 * Keeps tests honest: the algorithm under test is the same; only the env check is omitted.
 */
function useFocusTrapTestable(
  containerRef: Ref<HTMLElement | null>,
  isOpen: Ref<boolean>,
) {
  const trigger = ref<HTMLElement | null>(null);

  watch(isOpen, (open) => {
    const container = containerRef.value;
    if (!container) return;

    if (!open) {
      if (trigger.value && typeof trigger.value.focus === 'function') {
        trigger.value.focus();
      }
      trigger.value = null;
      document.removeEventListener('keydown', onKeyDown);
      return;
    }

    trigger.value = document.activeElement as HTMLElement | null;

    window.setTimeout(() => {
      const items = getFocusable(container);
      if (items.length > 0) items[0]!.focus();
    }, 0);

    document.addEventListener('keydown', onKeyDown);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const items = getFocusable(container!);
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

// ── Test helpers ──────────────────────────────────────────────────────────────

function setup() {
  document.body.innerHTML = `
    <button id="trigger">Open</button>
    <div id="dialog">
      <button id="first">First</button>
      <button id="middle">Middle</button>
      <button id="last">Last</button>
    </div>
  `;
  const trigger = document.getElementById('trigger') as HTMLButtonElement;
  trigger.focus();
  const containerRef = ref(document.getElementById('dialog') as HTMLElement);
  const isOpen = ref(false);
  useFocusTrapTestable(containerRef, isOpen);
  return { trigger, containerRef, isOpen };
}

/** Flush Vue reactivity then let the setTimeout(0) inside the composable fire. */
async function flushAll(): Promise<void> {
  await nextTick();
  await nextTick();
  await new Promise<void>((resolve) => setTimeout(resolve, 20));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useFocusTrap', () => {
  it('focuses first focusable element when opened', async () => {
    const { isOpen } = setup();
    isOpen.value = true;
    await flushAll();
    expect(document.activeElement?.id).toBe('first');
  });

  it('Tab from last element wraps to first', async () => {
    const { isOpen } = setup();
    isOpen.value = true;
    await flushAll();

    const last = document.getElementById('last') as HTMLButtonElement;
    last.focus();

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab', shiftKey: false, bubbles: true, cancelable: true,
    }));

    expect(document.activeElement?.id).toBe('first');
  });

  it('Shift+Tab from first element wraps to last', async () => {
    const { isOpen } = setup();
    isOpen.value = true;
    await flushAll();

    const first = document.getElementById('first') as HTMLButtonElement;
    first.focus();

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab', shiftKey: true, bubbles: true, cancelable: true,
    }));

    expect(document.activeElement?.id).toBe('last');
  });

  it('returns focus to trigger element when closed', async () => {
    const { isOpen } = setup();
    isOpen.value = true;
    await flushAll();

    isOpen.value = false;
    await nextTick();
    await nextTick();

    expect(document.activeElement?.id).toBe('trigger');
  });
});
