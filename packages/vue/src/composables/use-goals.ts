import { useQuery } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { useSpaceIS } from "./use-spaceis";
import type { GetGoalsParams } from "@spaceis/sdk";

/**
 * Fetch a paginated list of community goals.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useGoals } from '@spaceis/vue';
 *
 * const { data } = useGoals();
 * </script>
 *
 * <template>
 *   <progress
 *     v-for="g in data?.data"
 *     :key="g.uuid"
 *     :value="g.current_amount"
 *     :max="g.target_amount"
 *   />
 * </template>
 * ```
 */
export function useGoals(params?: MaybeRefOrGetter<GetGoalsParams | undefined>) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: computed(() => ["spaceis", "goals", toValue(params)] as const),
    queryFn: () => client.goals.list(toValue(params)),
  });
}
