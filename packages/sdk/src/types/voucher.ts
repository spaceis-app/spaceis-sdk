/** Request body for redeeming a voucher code */
export interface UseVoucherRequest {
  /** Minecraft username */
  nick: string;
  /** Voucher code to redeem */
  code: string;
  /** reCAPTCHA v3 token */
  "g-recaptcha-response": string;
}
