"use client";

import { useCallback, useRef } from "react";
import { useSpaceIS } from "../provider";

export interface UseRecaptchaReturn {
  /**
   * Execute reCAPTCHA for a given action.
   * Loads the reCAPTCHA script on the first call (lazy loading).
   *
   * @param action - Action name (e.g. "checkout", "voucher")
   * @returns reCAPTCHA token
   */
  execute: (action: string) => Promise<string>;
}

/**
 * Hook for reCAPTCHA integration.
 * The reCAPTCHA script is loaded lazily on the first `execute` call.
 *
 * @example
 * ```tsx
 * function CheckoutForm() {
 *   const { execute } = useRecaptcha();
 *
 *   async function handleSubmit() {
 *     const token = await execute('checkout');
 *     await placeOrder({ recaptcha_token: token, ... });
 *   }
 * }
 * ```
 */
export function useRecaptcha(): UseRecaptchaReturn {
  const { client } = useSpaceIS();
  const loadedRef = useRef(false);
  const loadPromiseRef = useRef<Promise<void> | null>(null);

  const execute = useCallback(
    async (action: string): Promise<string> => {
      if (!loadedRef.current) {
        if (!loadPromiseRef.current) {
          loadPromiseRef.current = client.recaptcha.load()
            .then(() => {
              loadedRef.current = true;
            })
            .catch((err) => {
              loadPromiseRef.current = null;
              throw err;
            });
        }
        await loadPromiseRef.current;
      }
      return client.recaptcha.execute(action);
    },
    [client]
  );

  return { execute };
}
