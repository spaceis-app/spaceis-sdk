import type { RequestFn } from "../http";
import type { Goal, PaginatedResponse, GetGoalsParams } from "../types";

/**
 * Goals API module.
 *
 * Retrieves community goals — shared funding targets that players
 * contribute to through purchases. Each goal has a progress amount
 * and a target amount.
 *
 * @example
 * ```ts
 * const goals = await client.goals.list();
 * goals.data.forEach(g => {
 *   const percent = (g.current_amount / g.target_amount * 100).toFixed(0);
 *   console.log(`${g.name}: ${percent}%`);
 * });
 * ```
 */
export class GoalsModule {
  /** @internal */
  constructor(private request: RequestFn) {}

  /**
   * Get a paginated list of community goals.
   *
   * @param params - Optional sorting and pagination options
   * @returns Paginated response with goal data
   */
  async list(params?: GetGoalsParams): Promise<PaginatedResponse<Goal>> {
    return this.request("goals", { params });
  }
}
