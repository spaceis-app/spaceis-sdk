"use client";

import { Store, useStore } from "@tanstack/react-store";

const cartDrawerStore = new Store({ isOpen: false });

export function useCartDrawer() {
  const isOpen = useStore(cartDrawerStore, (s) => s.isOpen);

  return {
    isOpen,
    toggle: () => {
      cartDrawerStore.setState((s) => {
        const next = !s.isOpen;
        document.body.style.overflow = next ? "hidden" : "";
        return { ...s, isOpen: next };
      });
    },
    open: () => {
      cartDrawerStore.setState((s) => ({ ...s, isOpen: true }));
      document.body.style.overflow = "hidden";
    },
    close: () => {
      cartDrawerStore.setState((s) => ({ ...s, isOpen: false }));
      document.body.style.overflow = "";
    },
  };
}
