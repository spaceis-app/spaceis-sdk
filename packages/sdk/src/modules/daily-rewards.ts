import type { RequestFn } from "../http";
import type { UseDailyRewardRequest, MessageResponse } from "../types";

/**
 * Daily Rewards API module.
 *
 * Allows players to claim their daily login reward.
 * Each player can claim once per day.
 *
 * @example
 * ```ts
 * const result = await client.dailyRewards.claim({
 *   nick: 'Steve',
 *   'g-recaptcha-response': recaptchaToken,
 * });
 * console.log(result.message); // "Daily reward claimed!"
 * ```
 */
export class DailyRewardsModule {
  /** @internal */
  constructor(private request: RequestFn) {}

  /**
   * Claim the daily reward for a player.
   *
   * @param data - Player username (and optional reCAPTCHA token)
   * @returns Success message from the server
   * @throws {@link SpaceISError} with status 422 if already claimed today
   */
  async claim(data: UseDailyRewardRequest): Promise<MessageResponse> {
    return this.request("daily-rewards/use", { method: "POST", body: data });
  }
}
