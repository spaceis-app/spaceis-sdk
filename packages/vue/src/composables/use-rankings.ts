import { useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRef } from "vue";
import { useSpaceIS } from "./use-spaceis";
import type { GetTopCustomersParams, GetLatestOrdersParams } from "@spaceis/sdk";

/**
 * Fetch the top customers ranking.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useTopCustomers } from '@spaceis/vue';
 *
 * const { data } = useTopCustomers({ limit: 10 });
 * </script>
 *
 * <template>
 *   <ol>
 *     <li v-for="c in data" :key="c.username">{{ c.username }}</li>
 *   </ol>
 * </template>
 * ```
 */
export function useTopCustomers(params?: MaybeRef<GetTopCustomersParams | undefined>) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "rankings", "top", params] as const,
    queryFn: () => client.rankings.top(toValue(params)),
  });
}

/**
 * Fetch the latest orders/purchases.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useLatestOrders } from '@spaceis/vue';
 *
 * const { data } = useLatestOrders({ limit: 5 });
 * </script>
 *
 * <template>
 *   <ul>
 *     <li v-for="o in data" :key="o.uuid">{{ o.username }}</li>
 *   </ul>
 * </template>
 * ```
 */
export function useLatestOrders(params?: MaybeRef<GetLatestOrdersParams | undefined>) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "rankings", "latest", params] as const,
    queryFn: () => client.rankings.latest(toValue(params)),
  });
}
