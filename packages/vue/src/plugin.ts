import { type App, type InjectionKey } from "vue";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import {
  createSpaceIS,
  type SpaceISClient,
  type SpaceISOptions,
  type CartManagerOptions,
} from "@spaceis/sdk";
import type { CartManager } from "@spaceis/sdk";

// ── Context ──────────────────────────────────────────────────────────────────

export interface SpaceISContext {
  client: SpaceISClient;
  cartManager: CartManager | null;
}

export const SpaceISKey: InjectionKey<SpaceISContext> = Symbol("spaceis");

// ── Plugin options ───────────────────────────────────────────────────────────

export interface SpaceISPluginOptions {
  /** SpaceIS SDK configuration */
  config: SpaceISOptions;
  /** CartManager options (storage prefix, autoLoad, etc.) */
  cartOptions?: CartManagerOptions;
  /**
   * Provide your own QueryClient to share with the rest of your app.
   * If omitted, a default client is created with sensible defaults.
   */
  queryClient?: QueryClient;
}

// ── Plugin ───────────────────────────────────────────────────────────────────

/**
 * Vue plugin that sets up the SpaceIS client, cart manager, and TanStack Vue Query.
 *
 * Install it with `app.use()`:
 *
 * @example
 * ```ts
 * import { createApp } from 'vue';
 * import { SpaceISPlugin } from '@spaceis/vue';
 * import App from './App.vue';
 *
 * const app = createApp(App);
 * app.use(SpaceISPlugin, {
 *   config: { baseUrl: 'https://storefront-api.spaceis.app', shopUuid: 'xxx' },
 *   cartOptions: { autoLoad: true },
 * });
 * app.mount('#app');
 * ```
 */
export const SpaceISPlugin = {
  install(app: App, options: SpaceISPluginOptions) {
    const client = createSpaceIS(options.config);
    const cartManager = client.createCartManager(options.cartOptions);

    const qc =
      options.queryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      });

    app.use(VueQueryPlugin, { queryClient: qc });
    app.provide(SpaceISKey, { client, cartManager });
  },
};
