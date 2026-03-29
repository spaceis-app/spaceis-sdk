"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useSpaceIS } from "../provider";
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
 * @example
 * ```tsx
 * function CheckoutButton() {
 *   const { mutate, isPending, data: result } = usePlaceOrder();
 *
 *   return (
 *     <button
 *       disabled={isPending}
 *       onClick={() => mutate({ payment_method_id: 1, email: 'user@example.com', ... })}
 *     >
 *       {isPending ? 'Processing...' : 'Place Order'}
 *     </button>
 *   );
 * }
 * ```
 */
export function usePlaceOrder() {
  const { client } = useSpaceIS();

  return useMutation({
    mutationFn: (data: CheckoutRequest) => client.checkout.placeOrder(data),
  });
}

/**
 * Convenience hook that combines payment methods, agreements, and the place-order mutation.
 *
 * @example
 * ```tsx
 * function CheckoutPage() {
 *   const { methods, agreements, placeOrder } = useCheckout();
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault();
 *       placeOrder.mutate({ ... });
 *     }}>
 *       {methods.data?.map(m => <PaymentOption key={m.id} method={m} />)}
 *       {agreements.data?.map(a => <AgreementCheckbox key={a.id} agreement={a} />)}
 *       <button type="submit" disabled={placeOrder.isPending}>Pay</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useCheckout() {
  const methods = usePaymentMethods();
  const agreements = useAgreements();
  const placeOrder = usePlaceOrder();

  return { methods, agreements, placeOrder };
}
