import { shallowRef } from "vue";
import { useSpaceIS } from "./use-spaceis";

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
 * Composable for reCAPTCHA integration.
 * The reCAPTCHA script is loaded lazily on the first `execute` call.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useRecaptcha } from '@spaceis/vue';
 *
 * const { execute } = useRecaptcha();
 *
 * async function handleSubmit() {
 *   const token = await execute('checkout');
 *   await placeOrder({ recaptcha_token: token });
 * }
 * </script>
 * ```
 */
export function useRecaptcha(): UseRecaptchaReturn {
  const { client } = useSpaceIS();
  const loaded = shallowRef(false);

  async function execute(action: string): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error('useRecaptcha can only be used on the client');
    }
    if (!loaded.value) {
      try {
        await client.recaptcha.load();
        loaded.value = true;
      } catch (error) {
        loaded.value = false;
        throw error;
      }
    }
    return client.recaptcha.execute(action);
  }

  return { execute };
}
