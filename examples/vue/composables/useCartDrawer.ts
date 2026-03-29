export function useCartDrawer() {
  const isOpen = useState('cart-drawer-open', () => false);

  return {
    isOpen: readonly(isOpen),
    toggle: () => {
      isOpen.value = !isOpen.value;
      if (import.meta.client) {
        document.body.style.overflow = isOpen.value ? 'hidden' : '';
      }
    },
    open: () => {
      isOpen.value = true;
      if (import.meta.client) {
        document.body.style.overflow = 'hidden';
      }
    },
    close: () => {
      isOpen.value = false;
      if (import.meta.client) {
        document.body.style.overflow = '';
      }
    },
  };
}