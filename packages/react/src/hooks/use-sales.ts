"use client";

import { useQuery } from "@tanstack/react-query";
import { useSpaceIS } from "../provider";
import type { GetSalesParams } from "@spaceis/sdk";

/**
 * Fetch a paginated list of active sales/promotions.
 *
 * @example
 * ```tsx
 * function SalesBanner() {
 *   const { data } = useSales({ sort: 'expires_at' });
 *   return <>{data?.data.map(s => <div key={s.uuid}>{s.name}</div>)}</>;
 * }
 * ```
 */
export function useSales(params?: GetSalesParams) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "sales", params] as const,
    queryFn: () => client.sales.list(params),
  });
}
