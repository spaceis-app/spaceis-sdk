"use client";

import { useQuery } from "@tanstack/react-query";
import { useSpaceIS } from "../provider";
import type { GetPackagesParams } from "@spaceis/sdk";

/**
 * Fetch a paginated list of packages (bundles).
 *
 * @example
 * ```tsx
 * function PackageList() {
 *   const { data, isLoading } = usePackages({ page: 1 });
 *   if (isLoading) return <Spinner />;
 *   return <ul>{data?.data.map(p => <li key={p.uuid}>{p.name}</li>)}</ul>;
 * }
 * ```
 */
export function usePackages(params?: GetPackagesParams) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "packages", params] as const,
    queryFn: () => client.packages.list(params),
  });
}
