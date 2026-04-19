import { shallowRef, computed, getCurrentInstance, onMounted, onUnmounted, type ComputedRef, type ShallowRef } from "vue";
import { useSpaceIS } from "./use-spaceis";
import { fromApiQty, type Cart, type CartItem, type CartMutationResponse, type SpaceISError } from "@spaceis/sdk";

export interface UseCartReturn {
  cart: ShallowRef<Cart | null>;
  items: ComputedRef<CartItem[]>;
  itemCount: ComputedRef<number>;
  totalQuantity: ComputedRef<number>;
  finalPrice: ComputedRef<number>;
  regularPrice: ComputedRef<number>;
  discount: ComputedRef<Cart["discount"]>;
  hasDiscount: ComputedRef<boolean>;
  isEmpty: ComputedRef<boolean>;
  isLoading: ShallowRef<boolean>;
  error: ShallowRef<SpaceISError | Error | null>;

  load: () => Promise<Cart>;
  add: (variantUuid: string, quantity?: number) => Promise<CartMutationResponse>;
  remove: (variantUuid: string, quantity?: number) => Promise<CartMutationResponse>;
  increment: (variantUuid: string) => Promise<CartMutationResponse>;
  decrement: (variantUuid: string) => Promise<CartMutationResponse>;
  setQuantity: (variantUuid: string, quantity: number) => Promise<CartMutationResponse>;
  applyDiscount: (code: string) => Promise<CartMutationResponse>;
  removeDiscount: () => Promise<CartMutationResponse>;
  clear: () => void;

  findItem: (variantUuid: string) => CartItem | null;
  hasItem: (variantUuid: string) => boolean;
  getQuantity: (variantUuid: string) => number;
  formatPrice: (cents?: number, currency?: string, locale?: string) => string;
}

const ssrNoop = (): Promise<never> =>
  Promise.reject(new Error("Cart operations are not available during SSR"));

/**
 * Reactive cart composable.
 *
 * All state is derived from Vue refs that update when CartManager notifies.
 * Subscription starts on mount to avoid hydration mismatches.
 *
 * @remarks
 * Must be called inside a component's `setup()` function (or in a
 * composable called from `setup()`). Calling it outside a Vue instance
 * (e.g. from a Pinia store or a bare module-level function) will read
 * the current cart state once but the reactive subscription will never
 * start — `cart`, `items`, and `isEmpty` refs will not update.
 *
 * For non-component contexts use `cartManager` directly via
 * `useSpaceIS()` and wire your own `onChange` subscription.
 */
export function useCart(): UseCartReturn {
  const { cartManager } = useSpaceIS();

  // Use shallowRef — CartManager owns the state, no deep reactivity needed
  const cart = shallowRef<Cart | null>(null);
  const isLoading = shallowRef(false);
  const error = shallowRef<SpaceISError | Error | null>(null);

  function sync() {
    if (!cartManager) return;
    cart.value = cartManager.cart;
    isLoading.value = cartManager.isLoading;
    error.value = cartManager.error;
  }

  // Initial sync (safe on SSR — just reads current state)
  sync();

  // Subscribe on client mount — only register lifecycle hooks inside a component
  let unsubscribe: (() => void) | undefined;

  if (getCurrentInstance()) {
    onMounted(() => {
      if (!cartManager) return;
      sync();
      unsubscribe = cartManager.onChange(() => sync());
    });

    onUnmounted(() => {
      unsubscribe?.();
    });
  }

  return {
    cart,
    isLoading,
    error,
    items: computed(() => cart.value?.items ?? []),
    itemCount: computed(() => cart.value?.items?.length ?? 0),
    totalQuantity: computed(() => {
      const raw = cart.value?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
      return fromApiQty(raw);
    }),
    finalPrice: computed(() => cart.value?.final_price ?? 0),
    regularPrice: computed(() => cart.value?.regular_price ?? 0),
    discount: computed(() => cart.value?.discount ?? null),
    hasDiscount: computed(() => cart.value?.discount != null),
    isEmpty: computed(() => (cart.value?.items?.length ?? 0) === 0),

    load: cartManager ? cartManager.load.bind(cartManager) : ssrNoop,
    add: cartManager ? cartManager.add.bind(cartManager) : ssrNoop,
    remove: cartManager ? cartManager.remove.bind(cartManager) : ssrNoop,
    increment: cartManager ? cartManager.increment.bind(cartManager) : ssrNoop,
    decrement: cartManager ? cartManager.decrement.bind(cartManager) : ssrNoop,
    setQuantity: cartManager ? cartManager.setQuantity.bind(cartManager) : ssrNoop,
    applyDiscount: cartManager ? cartManager.applyDiscount.bind(cartManager) : ssrNoop,
    removeDiscount: cartManager ? cartManager.removeDiscount.bind(cartManager) : ssrNoop,
    clear: cartManager ? cartManager.clear.bind(cartManager) : () => {},

    findItem: (uuid) => cart.value?.items?.find(i => i.variant?.uuid === uuid) ?? null,
    hasItem: (uuid) => cart.value?.items?.some(i => i.variant?.uuid === uuid) ?? false,
    getQuantity: (uuid) => {
      const item = cart.value?.items?.find(i => i.variant?.uuid === uuid);
      return item ? fromApiQty(item.quantity) : 0;
    },
    formatPrice: cartManager ? cartManager.formatPrice.bind(cartManager) : () => "",
  };
}
