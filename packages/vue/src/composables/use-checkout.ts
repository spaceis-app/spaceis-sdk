import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useSpaceIS } from "./use-spaceis";
import type { CheckoutRequest } from "@spaceis/sdk";

/**
 * Fetch available payment methods for checkout.
 */
export function usePaymentMethods() {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "payment-methods"] as const,
    queryFn: () => client.checkout.paymentMethods(),
    staleTime: 10 * 60_000,
  });
}

/**
 * Fetch checkout agreements that the user must accept.
 */
export function useAgreements() {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "agreements"] as const,
    queryFn: () => client.checkout.agreements(),
    staleTime: 10 * 60_000,
  });
}

/**
 * Mutation for placing an order.
 *
 * @remarks
 * On success the cart is automatically cleared and the `['spaceis', 'cart']` query is
 * invalidated. Provide your own `onSuccess` via the mutation call
 * (`mutate(input, { onSuccess })`) to react after that.
 * When `cartManager` is `null` (SSR context), the clear step is safely skipped.
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePlaceOrder } from '@spaceis/vue';
 *
 * const { mutate, isPending } = usePlaceOrder();
 * </script>
 *
 * <template>
 *   <button
 *     :disabled="isPending"
 *     @click="mutate({ payment_method_id: 1, email: 'user@example.com' })"
 *   >
 *     {{ isPending ? 'Processing...' : 'Place Order' }}
 *   </button>
 * </template>
 * ```
 */
export function usePlaceOrder() {
  const { client, cartManager } = useSpaceIS();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CheckoutRequest) => client.checkout.placeOrder(data),
    onSuccess: () => {
      cartManager?.clear();
      queryClient.invalidateQueries({ queryKey: ["spaceis", "cart"] });
    },
  });
}

/**
 * Convenience composable that combines payment methods, agreements, and the place-order mutation.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useCheckout } from '@spaceis/vue';
 *
 * const { methods, agreements, placeOrder } = useCheckout();
 * </script>
 *
 * <template>
 *   <form @submit.prevent="placeOrder.mutate({ payment_method_id: 1, email: 'user@example.com' })">
 *     <label v-for="m in methods.data" :key="m.id">
 *       <input type="radio" name="payment" :value="m.id" /> {{ m.name }}
 *     </label>
 *     <label v-for="a in agreements.data" :key="a.id">
 *       <input type="checkbox" :required="a.required" /> {{ a.name }}
 *     </label>
 *     <button type="submit" :disabled="placeOrder.isPending">Pay</button>
 *   </form>
 * </template>
 * ```
 */
export function useCheckout() {
  const methods = usePaymentMethods();
  const agreements = useAgreements();
  const placeOrder = usePlaceOrder();

  return { methods, agreements, placeOrder };
}
