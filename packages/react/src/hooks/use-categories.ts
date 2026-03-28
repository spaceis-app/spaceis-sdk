"use client";

import { useQuery } from "@tanstack/react-query";
import { useSpaceIS } from "../provider";
import type { GetCategoriesParams } from "@spaceis/sdk";

/**
 * Fetch shop categories.
 * Uses a longer stale time (5 min) since categories rarely change.
 *
 * @example
 * ```tsx
 * function CategoryNav() {
 *   const { data: categories = [] } = useCategories();
 *   return <nav>{categories.map(c => <a key={c.uuid} href={c.slug}>{c.name}</a>)}</nav>;
 * }
 * ```
 */
export function useCategories(params?: GetCategoriesParams) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "categories", params] as const,
    queryFn: () => client.categories.list(params),
    staleTime: 5 * 60_000,
  });
}
