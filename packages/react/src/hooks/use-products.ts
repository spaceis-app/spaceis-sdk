"use client";

import { useQuery } from "@tanstack/react-query";
import { useSpaceIS } from "../provider";
import type { GetProductsParams } from "@spaceis/sdk";

/**
 * Fetch a paginated list of products.
 *
 * @example
 * ```tsx
 * function ProductList() {
 *   const { data, isLoading } = useProducts({ page: 1, category: 'vip' });
 *   if (isLoading) return <Spinner />;
 *   return <ul>{data?.data.map(p => <li key={p.uuid}>{p.name}</li>)}</ul>;
 * }
 * ```
 */
export function useProducts(params?: GetProductsParams) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "products", params] as const,
    queryFn: () => client.products.list(params),
  });
}
