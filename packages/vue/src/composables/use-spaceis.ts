import { inject } from "vue";
import { SpaceISKey, type SpaceISContext } from "../plugin";

/**
 * Access the SpaceIS client and cart manager from any component
 * inside an app that installed `SpaceISPlugin`.
 *
 * @throws If called outside of an app with `SpaceISPlugin` installed.
 *
 * @see For query invalidation outside a mutation `onSuccess`, use
 * `useQueryClient()` from `@tanstack/vue-query` — it returns the same
 * QueryClient instance that was provided to the SpaceISPlugin.
 *
 * @example
 * ```ts
 * const { client, cartManager } = useSpaceIS();
 * ```
 */
export function useSpaceIS(): SpaceISContext {
  const ctx = inject(SpaceISKey);
  if (!ctx) {
    throw new Error(
      "useSpaceIS must be used within an app that has installed SpaceISPlugin. " +
        "Make sure you called app.use(SpaceISPlugin, { config: ... })."
    );
  }
  return ctx;
}
