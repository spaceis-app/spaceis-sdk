"use client";

import { useEffect } from "react";
import { Store, useStore } from "@tanstack/react-store";

const cartDrawerStore = new Store({ isOpen: false });

export function useCartDrawer() {
  const isOpen = useStore(cartDrawerStore, (s) => s.isOpen);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return {
    isOpen,
    toggle: () => cartDrawerStore.setState((s) => ({ ...s, isOpen: !s.isOpen })),
    open: () => cartDrawerStore.setState((s) => ({ ...s, isOpen: true })),
    close: () => cartDrawerStore.setState((s) => ({ ...s, isOpen: false })),
  };
}
