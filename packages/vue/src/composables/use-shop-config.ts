import { useQuery } from "@tanstack/vue-query";
import { useSpaceIS } from "./use-spaceis";

/**
 * Fetch the shop's template configuration (colors, layout, section settings, etc.).
 * Uses a longer stale time (10 min) since shop config rarely changes.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useShopConfig } from '@spaceis/vue';
 *
 * const { data: config } = useShopConfig();
 * </script>
 *
 * <template>
 *   <div :style="{ '--accent': config?.meta.accent_color }">
 *     <slot />
 *   </div>
 * </template>
 * ```
 */
export function useShopConfig() {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "shop-config"] as const,
    queryFn: () => client.shop.config(),
    staleTime: 10 * 60_000,
  });
}
