/** Request body for claiming a daily reward */
export interface UseDailyRewardRequest {
  /** Minecraft username */
  nick: string;
  /** reCAPTCHA v3 token */
  "g-recaptcha-response": string;
}
