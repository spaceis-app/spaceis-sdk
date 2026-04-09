import { useQuery } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRef } from "vue";
import { useSpaceIS } from "./use-spaceis";
import type { GetPackagesParams } from "@spaceis/sdk";

/**
 * Fetch a paginated list of packages (bundles).
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePackages } from '@spaceis/vue';
 *
 * const { data, isLoading } = usePackages({ page: 1 });
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
export function usePackages(params?: MaybeRef<GetPackagesParams | undefined>) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: computed(() => ["spaceis", "packages", toValue(params)] as const),
    queryFn: () => client.packages.list(toValue(params)),
  });
}
