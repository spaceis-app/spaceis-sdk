import { useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRef } from "vue";
import { useSpaceIS } from "./use-spaceis";
import type { GetProductsParams } from "@spaceis/sdk";

/**
 * Fetch a paginated list of products.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useProducts } from '@spaceis/vue';
 *
 * const { data, isLoading } = useProducts({ page: 1, category: 'vip' });
 * </script>
 *
 * <template>
 *   <p v-if="isLoading">Loading...</p>
 *   <ul v-else>
 *     <li v-for="p in data?.data" :key="p.uuid">{{ p.name }}</li>
 *   </ul>
 * </template>
 * ```
 */
export function useProducts(params?: MaybeRef<GetProductsParams | undefined>) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "products", params] as const,
    queryFn: () => client.products.list(toValue(params)),
  });
}
