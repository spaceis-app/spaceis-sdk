import { useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRef } from "vue";
import { useSpaceIS } from "./use-spaceis";
import type { GetSalesParams } from "@spaceis/sdk";

/**
 * Fetch a paginated list of active sales/promotions.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useSales } from '@spaceis/vue';
 *
 * const { data } = useSales({ sort: 'expires_at' });
 * </script>
 *
 * <template>
 *   <div v-for="s in data?.data" :key="s.uuid">{{ s.name }}</div>
 * </template>
 * ```
 */
export function useSales(params?: MaybeRef<GetSalesParams | undefined>) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "sales", params] as const,
    queryFn: () => client.sales.list(toValue(params)),
  });
}
