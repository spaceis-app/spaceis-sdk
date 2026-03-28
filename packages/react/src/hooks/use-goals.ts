"use client";

import { useQuery } from "@tanstack/react-query";
import { useSpaceIS } from "../provider";
import type { GetGoalsParams } from "@spaceis/sdk";

/**
 * Fetch a paginated list of community goals.
 *
 * @example
 * ```tsx
 * function GoalProgress() {
 *   const { data } = useGoals();
 *   return <>{data?.data.map(g => <progress key={g.uuid} value={g.current_amount} max={g.target_amount} />)}</>;
 * }
 * ```
 */
export function useGoals(params?: GetGoalsParams) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "goals", params] as const,
    queryFn: () => client.goals.list(params),
  });
}
