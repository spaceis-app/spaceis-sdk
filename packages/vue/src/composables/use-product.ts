import { useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRef } from "vue";
import { useSpaceIS } from "./use-spaceis";

/**
 * Fetch a single product by slug or UUID.
 * The query is disabled when `slug` is `null`.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useProduct } from '@spaceis/vue';
 *
 * const props = defineProps<{ slug: string }>();
 * const { data: product, isLoading } = useProduct(() => props.slug);
 * </script>
 *
 * <template>
 *   <p v-if="isLoading">Loading...</p>
 *   <h1 v-else>{{ product?.name }}</h1>
 * </template>
 * ```
 */
export function useProduct(slug: MaybeRef<string | null>) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "product", slug] as const,
    queryFn: () => client.products.get(toValue(slug)!),
    enabled: () => {
      const s = toValue(slug);
      return s !== null && s.length > 0;
    },
  });
}

/**
 * Fetch package recommendations for a product.
 * The query is disabled when `slug` is `null`.
 */
export function useProductRecommendations(slug: MaybeRef<string | null>) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "product-recommendations", slug] as const,
    queryFn: () => client.products.recommendations(toValue(slug)!),
    enabled: () => {
      const s = toValue(slug);
      return s !== null && s.length > 0;
    },
  });
}
