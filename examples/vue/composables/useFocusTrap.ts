import { ref, watch, type Ref } from 'vue';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Trap Tab focus inside a container while `isOpen.value` is true and return
 * focus to whatever element was focused when the trap activated once it closes.
 *
 * Usage:
 * ```vue
 * <script setup>
 * const isOpen = ref(false);
 * const drawerRef = ref<HTMLElement | null>(null);
 * useFocusTrap(drawerRef, isOpen);
 * </script>
 * <template>
 *   <div ref="drawerRef" role="dialog" aria-modal="true">…</div>
 * </template>
 * ```
 */
export function useFocusTrap(
  containerRef: Ref<HTMLElement | null>,
  isOpen: Ref<boolean>,
) {
  const trigger = ref<HTMLElement | null>(null);

  watch(isOpen, (open) => {
    if (!import.meta.client) return;
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
      if (items.length > 0) items[0].focus();
    }, 0);

    document.addEventListener('keydown', onKeyDown);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const items = getFocusable(container!);
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
    }
  });
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled'),
  );
}
