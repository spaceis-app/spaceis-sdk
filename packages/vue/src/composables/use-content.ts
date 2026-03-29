import { useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRef } from "vue";
import { useSpaceIS } from "./use-spaceis";
import type { GetPagesParams } from "@spaceis/sdk";

/**
 * Fetch a list of CMS pages.
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePages } from '@spaceis/vue';
 *
 * const { data: pages } = usePages();
 * </script>
 *
 * <template>
 *   <a v-for="p in pages" :key="p.uuid" :href="`/page/${p.slug}`">{{ p.title }}</a>
 * </template>
 * ```
 */
export function usePages(params?: MaybeRef<GetPagesParams | undefined>) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "pages", params] as const,
    queryFn: () => client.content.pages(toValue(params)),
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch a single CMS page by slug.
 * The query is disabled when `slug` is `null`.
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePage } from '@spaceis/vue';
 *
 * const props = defineProps<{ slug: string }>();
 * const { data: page, isLoading } = usePage(() => props.slug);
 * </script>
 *
 * <template>
 *   <p v-if="isLoading">Loading...</p>
 *   <article v-else v-html="page?.content" />
 * </template>
 * ```
 */
export function usePage(slug: MaybeRef<string | null>) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "page", slug] as const,
    queryFn: () => client.content.page(toValue(slug)!),
    enabled: () => {
      const s = toValue(slug);
      return s !== null && s.length > 0;
    },
  });
}

/**
 * Fetch the shop's legal statute.
 * Uses a longer stale time (10 min) since statute rarely changes.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useStatute } from '@spaceis/vue';
 *
 * const { data: statute } = useStatute();
 * </script>
 *
 * <template>
 *   <article v-html="statute?.content" />
 * </template>
 * ```
 */
export function useStatute() {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "statute"] as const,
    queryFn: () => client.content.statute(),
    staleTime: 10 * 60_000,
  });
}
