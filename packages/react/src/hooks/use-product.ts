"use client";

import { useQuery } from "@tanstack/react-query";
import { useSpaceIS } from "../provider";

/**
 * Fetch a single product by slug or UUID.
 * The query is disabled when `slug` is `null`.
 *
 * @example
 * ```tsx
 * function ProductDetail({ slug }: { slug: string }) {
 *   const { data: product, isLoading } = useProduct(slug);
 *   if (isLoading) return <Spinner />;
 *   return <h1>{product?.name}</h1>;
 * }
 * ```
 */
export function useProduct(slug: string | null) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "product", slug] as const,
    queryFn: () => client.products.get(slug!),
    enabled: slug !== null && slug.length > 0,
  });
}

/**
 * Fetch package recommendations for a product.
 * The query is disabled when `slug` is `null`.
 */
export function useProductRecommendations(slug: string | null) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "product-recommendations", slug] as const,
    queryFn: () => client.products.recommendations(slug!),
    enabled: slug !== null && slug.length > 0,
  });
}
