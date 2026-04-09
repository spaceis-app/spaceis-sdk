import type { RequestFn } from "../http";
import type { UseVoucherRequest, MessageResponse } from "../types";

/**
 * Vouchers API module.
 *
 * Allows players to redeem voucher codes for in-game rewards.
 * Requires the player's username and the voucher code.
 *
 * @example
 * ```ts
 * const result = await client.vouchers.redeem({
 *   nick: 'Steve',
 *   code: 'FREE-VIP-2024',
 *   'g-recaptcha-response': recaptchaToken,
 * });
 * console.log(result.message); // "Voucher redeemed successfully"
 * ```
 */
export class VouchersModule {
  /** @internal */
  constructor(private request: RequestFn) {}

  /**
   * Redeem a voucher code.
   *
   * @param data - Username and voucher code
   * @returns Success message from the server
   * @throws {@link SpaceISError} with status 422 if the voucher is invalid or expired
   */
  async redeem(data: UseVoucherRequest): Promise<MessageResponse> {
    return this.request("vouchers/use", { method: "POST", body: data });
  }
}
