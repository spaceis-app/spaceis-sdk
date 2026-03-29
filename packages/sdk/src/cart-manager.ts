import type { Cart, CartItem, CartMutationResponse } from "./types";
import type { SpaceISClient } from "./client";
import { toApiQty, fromApiQty } from "./utils";

type Listener = (cart: Cart | null) => void;

/** Default step size in API units (1 item = 1000) */
const DEFAULT_STEP = 1000;

/** Generate a UUID v4 cart token */
function generateToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  throw new Error("No cryptographically secure random generator available");
}

export interface CartManagerOptions {
  /** localStorage key prefix (default: "spaceis_cart_") */
  storagePrefix?: string;
  /** Auto-load cart from server on creation (default: false) */
  autoLoad?: boolean;
}

/**
 * Reactive cart state manager.
 *
 * Wraps the low-level CartModule with:
 * - Automatic cart token persistence (localStorage)
 * - Subscribe/unsubscribe pattern for UI updates
 * - Convenience getters (count, total, isEmpty, etc.)
 *
 * @example
 * ```js
 * var cart = client.createCartManager();
 *
 * cart.onChange(function (data) {
 *   document.getElementById('count').textContent = cart.totalQuantity;
 *   document.getElementById('total').textContent = cart.formatPrice();
 * });
 *
 * cart.load();
 * cart.add('variant-uuid', 1);
 * ```
 */
export class CartManager {
  private _cart: Cart | null = null;
  private _listeners = new Set<Listener>();
  private _loading = false;
  /** Learned step sizes per variant (raw API units) */
  private _steps = new Map<string, number>();
  private _error: unknown = null;
  private storageKey: string;

  constructor(
    private client: SpaceISClient,
    options: CartManagerOptions = {}
  ) {
    const prefix = options.storagePrefix ?? "spaceis_cart_";
    this.storageKey = `${prefix}${client.shopUuid}`;

    // Restore cart token from localStorage
    const saved = this.storage?.getItem(this.storageKey);
    if (saved) {
      client.setCartToken(saved);
    }

    if (options.autoLoad) {
      // Intentionally silent: initial load failure is non-fatal
      this.load().catch(() => {});
    }
  }

  // ── Getters ──

  /** Current cart data (null if not loaded yet) */
  get cart(): Cart | null {
    return this._cart;
  }

  /** Cart items array */
  get items(): CartItem[] {
    return this._cart?.items ?? [];
  }

  /** Number of unique items in cart */
  get itemCount(): number {
    return this._cart?.items.length ?? 0;
  }

  /** Total quantity of all items (human-readable: 1, 2, 3...) */
  get totalQuantity(): number {
    const raw = this._cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
    return fromApiQty(raw);
  }

  /** Regular price in cents (before discounts) */
  get regularPrice(): number {
    return this._cart?.regular_price ?? 0;
  }

  /** Final price in cents (after discounts, before payment commission) */
  get finalPrice(): number {
    return this._cart?.final_price ?? 0;
  }

  /** Active discount or null */
  get discount() {
    return this._cart?.discount ?? null;
  }

  /** True if a discount is applied */
  get hasDiscount(): boolean {
    return this._cart?.discount != null;
  }

  /** True if cart has no items */
  get isEmpty(): boolean {
    return this.itemCount === 0;
  }

  /** True while a network request is in progress */
  get isLoading(): boolean {
    return this._loading;
  }

  /** Last error (or null) */
  get error(): unknown {
    return this._error;
  }

  // ── Helpers ──

  /**
   * Format price in cents to a human-readable string.
   * @param cents - Amount in cents (defaults to finalPrice)
   * @param currency - Currency code (default: "PLN")
   * @param locale - Locale (default: client lang or "pl")
   */
  formatPrice(cents?: number, currency = "PLN", locale?: string): string {
    const amount = cents ?? this.finalPrice;
    const loc = locale ?? this.client.config.lang ?? "pl";
    return new Intl.NumberFormat(loc, {
      style: "currency",
      currency,
    }).format(amount / 100);
  }

  /** Find item by variant UUID */
  findItem(variantUuid: string): CartItem | null {
    return this.items.find((i) => i.variant.uuid === variantUuid) ?? null;
  }

  /** Check if a variant is in the cart */
  hasItem(variantUuid: string): boolean {
    return this.findItem(variantUuid) !== null;
  }

  /** Get quantity for a variant (human-readable: 0, 1, 2...) */
  getQuantity(variantUuid: string): number {
    const raw = this.findItem(variantUuid)?.quantity ?? 0;
    return fromApiQty(raw);
  }

  // ── Subscriptions ──

  /**
   * Subscribe to cart changes. The listener fires immediately with current state,
   * and on every subsequent change.
   * @returns Unsubscribe function
   */
  onChange(fn: Listener): () => void {
    this._listeners.add(fn);
    fn(this._cart);
    return () => {
      this._listeners.delete(fn);
    };
  }

  private notify() {
    for (const fn of this._listeners) {
      try {
        fn(this._cart);
      } catch {
        // Listener error — don't break the chain
      }
    }
  }

  // ── Token management ──

  /** Ensure a cart token exists (generate if needed) */
  private ensureToken(): void {
    if (!this.client.cartToken) {
      const token = generateToken();
      this.client.setCartToken(token);
      this.storage?.setItem(this.storageKey, token);
    }
  }

  private saveToken() {
    const token = this.client.cartToken;
    if (token) {
      this.storage?.setItem(this.storageKey, token);
    }
  }

  private get storage(): Storage | null {
    try {
      return globalThis.localStorage;
    } catch {
      return null;
    }
  }

  // ── Mutation helper ──

  private applyMutation(res: CartMutationResponse): CartMutationResponse {
    this._cart = res.data.cart;
    this._error = null;
    this._loading = false;
    this.notify();
    return res;
  }

  // ── Cart Operations ──

  /** Load/refresh cart from server */
  async load(): Promise<Cart> {
    // Only load if we have a token (otherwise cart is empty)
    if (!this.client.cartToken) {
      const empty: Cart = { items: [], discount: null, regular_price: 0, final_price: 0 };
      this._cart = empty;
      this.notify();
      return empty;
    }
    this._loading = true;
    this._error = null;
    this.notify();
    try {
      const cart = await this.client.cart.get();
      this._cart = cart;
      this._loading = false;
      this.notify();
      return cart;
    } catch (e) {
      this._error = e;
      this._loading = false;
      this.notify();
      throw e;
    }
  }

  /**
   * Add variant to cart.
   * @param variantUuid - Variant UUID to add
   * @param quantity - Number of items (1, 2, 3...) — converted to API format automatically
   */
  async add(variantUuid: string, quantity = 1): Promise<CartMutationResponse> {
    this.ensureToken();
    this._loading = true;
    this.notify();
    try {
      const qtyBefore = this.findItem(variantUuid)?.quantity ?? 0;
      const res = await this.client.cart.addItem({
        variant_uuid: variantUuid,
        quantity: toApiQty(quantity),
      });
      this.saveToken();
      this.applyMutation(res);

      // Learn step from the quantity that was actually added
      const qtyAfter = this.findItem(variantUuid)?.quantity ?? 0;
      if (qtyAfter > qtyBefore && !this._steps.has(variantUuid)) {
        this._steps.set(variantUuid, qtyAfter - qtyBefore);
      }

      return res;
    } catch (e) {
      this._error = e;
      this._loading = false;
      this.notify();
      throw e;
    }
  }

  /**
   * Remove variant from cart.
   * @param variantUuid - Variant UUID to remove
   * @param quantity - Number of items to remove (omit to remove all)
   */
  async remove(variantUuid: string, quantity?: number): Promise<CartMutationResponse> {
    this.ensureToken();
    this._loading = true;
    this.notify();
    try {
      const res = await this.client.cart.removeItem({
        variant_uuid: variantUuid,
        ...(quantity != null ? { quantity: toApiQty(quantity) } : {}),
      });
      return this.applyMutation(res);
    } catch (e) {
      this._error = e;
      this._loading = false;
      this.notify();
      throw e;
    }
  }

  /**
   * Increment variant quantity by one step.
   * Uses known step from previous add, or defaults to 1000 (= 1 item).
   * Sends explicit quantity to ensure API validates max_quantity correctly.
   */
  async increment(variantUuid: string): Promise<CartMutationResponse> {
    this.ensureToken();
    this._loading = true;
    this.notify();
    try {
      const rawStep = this._steps.get(variantUuid) ?? DEFAULT_STEP;
      const res = await this.client.cart.addItem({
        variant_uuid: variantUuid,
        quantity: rawStep,
      });
      this.saveToken();
      return this.applyMutation(res);
    } catch (e) {
      this._error = e;
      this._loading = false;
      this.notify();
      throw e;
    }
  }

  /**
   * Decrement variant quantity by one step.
   * Uses step learned from increment(), or falls back to min_quantity (1000).
   * If item would go to zero or below, removes it entirely.
   */
  async decrement(variantUuid: string): Promise<CartMutationResponse> {
    this.ensureToken();
    const item = this.findItem(variantUuid);
    if (!item) return this.remove(variantUuid);

    // Use learned step, or fall back to removing the entire item
    const rawStep = this._steps.get(variantUuid) ?? item.quantity;

    // If removing one step would empty the item, remove entirely
    if (item.quantity <= rawStep) {
      return this.remove(variantUuid);
    }

    this._loading = true;
    this.notify();
    try {
      const res = await this.client.cart.removeItem({
        variant_uuid: variantUuid,
        quantity: rawStep,
      });
      return this.applyMutation(res);
    } catch (e) {
      this._error = e;
      this._loading = false;
      this.notify();
      throw e;
    }
  }

  /**
   * Set exact quantity for a variant.
   * @param variantUuid - Variant UUID
   * @param quantity - Desired quantity (1, 2, 3...) — converted to API format automatically
   */
  async setQuantity(variantUuid: string, quantity: number): Promise<CartMutationResponse> {
    this.ensureToken();
    this._loading = true;
    this.notify();
    try {
      const res = await this.client.cart.updateQuantity({
        variant_uuid: variantUuid,
        quantity: toApiQty(quantity),
      });
      return this.applyMutation(res);
    } catch (e) {
      this._error = e;
      this._loading = false;
      this.notify();
      throw e;
    }
  }

  /** Apply discount code */
  async applyDiscount(code: string): Promise<CartMutationResponse> {
    this.ensureToken();
    this._loading = true;
    this.notify();
    try {
      const res = await this.client.cart.applyDiscount(code);
      return this.applyMutation(res);
    } catch (e) {
      this._error = e;
      this._loading = false;
      this.notify();
      throw e;
    }
  }

  /** Remove active discount */
  async removeDiscount(): Promise<CartMutationResponse> {
    this.ensureToken();
    this._loading = true;
    this.notify();
    try {
      const res = await this.client.cart.removeDiscount();
      return this.applyMutation(res);
    } catch (e) {
      this._error = e;
      this._loading = false;
      this.notify();
      throw e;
    }
  }

  /** Clear cart state locally (does not call API) */
  clear() {
    this._cart = null;
    this._error = null;
    this._loading = false;
    this.storage?.removeItem(this.storageKey);
    this.client.setCartToken(undefined);
    this.notify();
  }
}
