"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createSpaceIS,
  type SpaceISClient,
  type SpaceISOptions,
  type CartManagerOptions,
} from "@spaceis/sdk";
import type { CartManager } from "@spaceis/sdk";

// ── Context ──────────────────────────────────────────────────────────────────

export interface SpaceISContextValue {
  client: SpaceISClient;
  cartManager: CartManager;
}

const SpaceISContext = createContext<SpaceISContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export interface SpaceISProviderProps {
  children: ReactNode;
  /**
   * SpaceIS SDK configuration.
   *
   * **Must be stable** — declare outside the component or wrap with `useMemo`.
   * Changing `config` after mount has no effect.
   */
  config: SpaceISOptions;
  /** CartManager options (storage prefix, autoLoad, etc.) */
  cartOptions?: CartManagerOptions;
  /**
   * Provide your own QueryClient to share with the rest of your app.
   * If omitted, a default client is created with sensible defaults.
   */
  queryClient?: QueryClient;
}

/**
 * Root provider for the SpaceIS React SDK.
 *
 * Wrap your application (or the relevant subtree) with this component.
 * It sets up the SpaceIS client, cart manager, and TanStack Query.
 *
 * @example
 * ```tsx
 * const config = { baseUrl: 'https://storefront-api.spaceis.app', shopUuid: 'xxx' };
 *
 * <SpaceISProvider config={config} cartOptions={{ autoLoad: true }}>
 *   <App />
 * </SpaceISProvider>
 * ```
 */
export function SpaceISProvider({
  children,
  config,
  cartOptions,
  queryClient,
}: SpaceISProviderProps) {
  // Create client and cart manager once — refs guarantee stability across re-renders
  // without requiring useMemo (which can still re-run in some edge cases).
  const clientRef = useRef<SpaceISClient | null>(null);
  const cartRef = useRef<CartManager | null>(null);
  const configRef = useRef(config);

  if (!clientRef.current) {
    clientRef.current = createSpaceIS(config);
  }
  if (!cartRef.current) {
    cartRef.current = clientRef.current.createCartManager(cartOptions);
  }

  // Warn if config identity changes after mount
  useEffect(() => {
    if (configRef.current !== config) {
      console.error(
        "[SpaceISProvider] The `config` prop changed after mount. " +
          "Config must be stable — declare it outside the component or wrap with useMemo."
      );
    }
  }, [config]);

  const contextValue = useMemo<SpaceISContextValue>(
    () => ({
      client: clientRef.current!,
      cartManager: cartRef.current!,
    }),
    []
  );

  const qc = useMemo(
    () =>
      queryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
    [queryClient]
  );

  return (
    <QueryClientProvider client={qc}>
      <SpaceISContext.Provider value={contextValue}>{children}</SpaceISContext.Provider>
    </QueryClientProvider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the SpaceIS client and cart manager from any component
 * inside `<SpaceISProvider>`.
 *
 * @throws If called outside of `<SpaceISProvider>`.
 */
export function useSpaceIS(): SpaceISContextValue {
  const ctx = useContext(SpaceISContext);
  if (!ctx) {
    throw new Error(
      "useSpaceIS must be used within <SpaceISProvider>. " +
        "Make sure your component tree is wrapped with <SpaceISProvider>."
    );
  }
  return ctx;
}
