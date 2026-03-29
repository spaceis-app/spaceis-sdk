import { useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRef } from "vue";
import { useSpaceIS } from "./use-spaceis";
import type { GetCategoriesParams } from "@spaceis/sdk";

/**
 * Fetch shop categories.
 * Uses a longer stale time (5 min) since categories rarely change.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useCategories } from '@spaceis/vue';
 *
 * const { data: categories } = useCategories();
 * </script>
 *
 * <template>
 *   <nav>
 *     <a v-for="c in categories" :key="c.uuid" :href="c.slug">{{ c.name }}</a>
 *   </nav>
 * </template>
 * ```
 */
export function useCategories(params?: MaybeRef<GetCategoriesParams | undefined>) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "categories", params] as const,
    queryFn: () => client.categories.list(toValue(params)),
    staleTime: 5 * 60_000,
  });
}
