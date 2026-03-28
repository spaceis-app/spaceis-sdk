"use client";

import { useQuery } from "@tanstack/react-query";
import { useSpaceIS } from "../provider";
import type { GetTopCustomersParams, GetLatestOrdersParams } from "@spaceis/sdk";

/**
 * Fetch the top customers ranking.
 *
 * @example
 * ```tsx
 * function TopCustomers() {
 *   const { data = [] } = useTopCustomers({ limit: 10 });
 *   return <ol>{data.map(c => <li key={c.username}>{c.username}</li>)}</ol>;
 * }
 * ```
 */
export function useTopCustomers(params?: GetTopCustomersParams) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "rankings", "top", params] as const,
    queryFn: () => client.rankings.top(params),
  });
}

/**
 * Fetch the latest orders/purchases.
 *
 * @example
 * ```tsx
 * function LatestOrders() {
 *   const { data = [] } = useLatestOrders({ limit: 5 });
 *   return <ul>{data.map(o => <li key={o.uuid}>{o.username}</li>)}</ul>;
 * }
 * ```
 */
export function useLatestOrders(params?: GetLatestOrdersParams) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "rankings", "latest", params] as const,
    queryFn: () => client.rankings.latest(params),
  });
}
