import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { SpaceISClient } from "../client";
import { CartManager } from "../cart-manager";
import type { Cart, CartMutationResponse } from "../types";

// ── Helpers ──

function makeClient(overrides: Partial<ConstructorParameters<typeof SpaceISClient>[0]> = {}) {
  return new SpaceISClient({
    baseUrl: "https://api.example.com",
    shopUuid: "shop-uuid-abc",
    ...overrides,
  });
}

function makeCart(overrides: Partial<Cart> = {}): Cart {
  return {
    items: [],
    discount: null,
    regular_price: 0,
    final_price: 0,
    ...overrides,
  };
}

function makeCartItem(variantUuid: string, quantity = 1000, price = 500) {
  return {
    shop_product: { uuid: "prod-1", name: "Product", image: null, price },
    variant: { uuid: variantUuid, name: "Variant", image: null, price },
    package: null,
    from_package: null,
    quantity,
    cart_item_sale: null,
    regular_price: price,
    regular_price_value: price * (quantity / 1000),
    final_price: price,
    final_price_value: price * (quantity / 1000),
  };
}

function makeMutationResponse(cart: Cart): CartMutationResponse {
  return { message: "OK", data: { cart } };
}

// ── Mock localStorage ──

function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
    removeItem: vi.fn((key: string) => { store.delete(key); }),
    clear: vi.fn(() => { store.clear(); }),
    get length() { return store.size; },
    key: vi.fn(() => null),
  };
}

let mockStorage: Storage;

beforeEach(() => {
  vi.restoreAllMocks();
  mockStorage = createMockStorage();
  vi.stubGlobal("localStorage", mockStorage);
});

// ── Tests ──

describe("CartManager", () => {
  describe("initialization", () => {
    it("has null cart by default", () => {
      const manager = new CartManager(makeClient());
      expect(manager.cart).toBeNull();
    });

    it("has empty items by default", () => {
      const manager = new CartManager(makeClient());
      expect(manager.items).toEqual([]);
    });

    it("isEmpty is true by default", () => {
      const manager = new CartManager(makeClient());
      expect(manager.isEmpty).toBe(true);
    });

    it("isLoading is false by default", () => {
      const manager = new CartManager(makeClient());
      expect(manager.isLoading).toBe(false);
    });

    it("error is null by default", () => {
      const manager = new CartManager(makeClient());
      expect(manager.error).toBeNull();
    });

    it("itemCount is 0 by default", () => {
      const manager = new CartManager(makeClient());
      expect(manager.itemCount).toBe(0);
    });

    it("totalQuantity is 0 by default", () => {
      const manager = new CartManager(makeClient());
      expect(manager.totalQuantity).toBe(0);
    });

    it("finalPrice is 0 by default", () => {
      const manager = new CartManager(makeClient());
      expect(manager.finalPrice).toBe(0);
    });

    it("regularPrice is 0 by default", () => {
      const manager = new CartManager(makeClient());
      expect(manager.regularPrice).toBe(0);
    });

    it("hasDiscount is false by default", () => {
      const manager = new CartManager(makeClient());
      expect(manager.hasDiscount).toBe(false);
    });
  });

  describe("token persistence", () => {
    it("restores cart token from localStorage on creation", () => {
      (mockStorage.getItem as Mock).mockReturnValue("saved-token");
      const client = makeClient();
      new CartManager(client);
      expect(client.cartToken).toBe("saved-token");
    });

    it("uses correct storage key based on shopUuid", () => {
      new CartManager(makeClient({ shopUuid: "my-shop" }));
      expect(mockStorage.getItem).toHaveBeenCalledWith("spaceis_cart_my-shop");
    });

    it("uses custom storage prefix", () => {
      new CartManager(makeClient({ shopUuid: "my-shop" }), { storagePrefix: "custom_" });
      expect(mockStorage.getItem).toHaveBeenCalledWith("custom_my-shop");
    });

    it("generates and persists a UUID token on first mutation", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(makeCart({
          items: [makeCartItem("v-1")],
        }))), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient();
      const manager = new CartManager(client);
      expect(client.cartToken).toBeUndefined();

      await manager.add("v-1");

      expect(client.cartToken).toBeDefined();
      expect(client.cartToken).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "spaceis_cart_shop-uuid-abc",
        client.cartToken
      );
    });

    it("does not generate a new token when one already exists", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(makeCart())), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "existing-token" });
      const manager = new CartManager(client);
      await manager.add("v-1");

      expect(client.cartToken).toBe("existing-token");
    });
  });

  describe("load()", () => {
    it("returns empty cart when no token exists", async () => {
      const client = makeClient();
      const manager = new CartManager(client);

      const cart = await manager.load();

      expect(cart.items).toEqual([]);
      expect(cart.regular_price).toBe(0);
      expect(cart.final_price).toBe(0);
      expect(manager.cart).toEqual(cart);
    });

    it("fetches cart from API when token exists", async () => {
      const cartData = makeCart({
        items: [makeCartItem("v-1", 2000, 1000)],
        regular_price: 2000,
        final_price: 2000,
      });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "my-token" });
      const manager = new CartManager(client);

      const cart = await manager.load();

      expect(cart).toEqual(cartData);
      expect(manager.cart).toEqual(cartData);
      expect(manager.isLoading).toBe(false);
    });

    it("sets isLoading to true during fetch", async () => {
      let resolvePromise: (v: Response) => void;
      const fetchMock = vi.fn().mockReturnValue(
        new Promise<Response>((resolve) => { resolvePromise = resolve; })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "my-token" });
      const manager = new CartManager(client);
      const loadPromise = manager.load();

      expect(manager.isLoading).toBe(true);

      resolvePromise!(new Response(JSON.stringify(makeCart()), { status: 200 }));
      await loadPromise;

      expect(manager.isLoading).toBe(false);
    });

    it("sets error on fetch failure", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("Network error"));
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "my-token" });
      const manager = new CartManager(client);

      await expect(manager.load()).rejects.toThrow("Network error");
      expect(manager.error).toBeInstanceOf(Error);
      expect(manager.isLoading).toBe(false);
    });

    it("notifies listeners on successful load", async () => {
      const cartData = makeCart({ items: [makeCartItem("v-1")] });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "my-token" });
      const manager = new CartManager(client);
      const listener = vi.fn();
      manager.onChange(listener);

      // Listener fires immediately with null (initial state)
      expect(listener).toHaveBeenCalledWith(null);
      listener.mockClear();

      await manager.load();

      // Fires twice: once for isLoading=true, once for completion
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it("notifies exactly twice on load error (start + error)", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("boom"));
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "my-token" });
      const manager = new CartManager(client);
      const listener = vi.fn();
      manager.onChange(listener);
      listener.mockClear();

      await expect(manager.load()).rejects.toThrow("boom");

      expect(listener).toHaveBeenCalledTimes(2);
      expect(manager.isLoading).toBe(false);
      expect(manager.error).toBeInstanceOf(Error);
    });

    it("notifies exactly once when no token (empty-cart shortcut, no _mutate)", async () => {
      const client = makeClient();
      const manager = new CartManager(client);
      const listener = vi.fn();
      manager.onChange(listener);
      listener.mockClear();

      await manager.load();

      // Empty-cart shortcut does not enter _mutate — single notify with empty cart
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("add()", () => {
    it("adds variant to cart and updates state", async () => {
      const cartAfter = makeCart({ items: [makeCartItem("v-1", 1000)] });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(cartAfter)), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient();
      const manager = new CartManager(client);
      const res = await manager.add("v-1");

      expect(res.data.cart).toEqual(cartAfter);
      expect(manager.cart).toEqual(cartAfter);
      expect(manager.items).toHaveLength(1);
    });

    it("converts quantity to API format (multiplied by 1000)", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(makeCart())), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient();
      const manager = new CartManager(client);
      await manager.add("v-1", 3);

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.quantity).toBe(3000);
    });

    it("defaults quantity to 1 (1000 in API format)", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(makeCart())), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient();
      const manager = new CartManager(client);
      await manager.add("v-1");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.quantity).toBe(1000);
    });

    it("sets error on failure and re-throws", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("Server error"));
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient();
      const manager = new CartManager(client);

      await expect(manager.add("v-1")).rejects.toThrow("Server error");
      expect(manager.error).toBeInstanceOf(Error);
      expect(manager.isLoading).toBe(false);
    });

    it("notifies exactly twice on add success (start + end)", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(makeCart({
          items: [makeCartItem("v-1", 1000)],
        }))), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient();
      const manager = new CartManager(client);
      const listener = vi.fn();
      manager.onChange(listener);
      listener.mockClear();

      await manager.add("v-1");

      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe("remove()", () => {
    it("removes variant from cart", async () => {
      const emptyCart = makeCart();
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(emptyCart)), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      const res = await manager.remove("v-1");

      expect(res.data.cart.items).toEqual([]);
      expect(manager.isEmpty).toBe(true);
    });

    it("sends quantity in API format when provided", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(makeCart())), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.remove("v-1", 2);

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.quantity).toBe(2000);
    });

    it("omits quantity when not provided (removes all)", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(makeCart())), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.remove("v-1");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.quantity).toBeUndefined();
    });

    it("sets error on failure", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("Fail"));
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);

      await expect(manager.remove("v-1")).rejects.toThrow("Fail");
      expect(manager.error).toBeInstanceOf(Error);
      expect(manager.isLoading).toBe(false);
    });
  });

  describe("increment()", () => {
    it("adds one step (default 1000) to a variant", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(makeCart({
          items: [makeCartItem("v-1", 2000)],
        }))), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.increment("v-1");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.quantity).toBe(1000);
      expect(body.variant_uuid).toBe("v-1");
    });

    it("uses learned step size from previous add", async () => {
      // First add: quantity goes from 0 to 2000, so step = 2000
      const cartAfterAdd = makeCart({ items: [makeCartItem("v-1", 2000)] });
      const cartAfterIncrement = makeCart({ items: [makeCartItem("v-1", 4000)] });

      const fetchMock = vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(makeMutationResponse(cartAfterAdd)), { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(makeMutationResponse(cartAfterIncrement)), { status: 200 })
        );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient();
      const manager = new CartManager(client);

      await manager.add("v-1", 2);
      await manager.increment("v-1");

      const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.quantity).toBe(2000);
    });

    it("sets error on failure", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("Fail"));
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);

      await expect(manager.increment("v-1")).rejects.toThrow("Fail");
      expect(manager.error).toBeInstanceOf(Error);
      expect(manager.isLoading).toBe(false);
    });
  });

  describe("decrement()", () => {
    it("removes item entirely when item not found in cart", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(makeCart())), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);

      await manager.decrement("v-1");

      // Should call removeItem (not addItem)
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("remove");
    });

    it("removes item entirely when quantity equals step", async () => {
      // Set up cart with 1 item at quantity 1000 (1 step)
      const cartWithItem = makeCart({ items: [makeCartItem("v-1", 1000)] });
      const emptyCart = makeCart();

      const fetchMock = vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: cartWithItem }), { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(makeMutationResponse(emptyCart)), { status: 200 })
        );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.load();
      await manager.decrement("v-1");

      // The removal call should not include a quantity (removes all)
      const [url] = fetchMock.mock.calls[1] as [string, RequestInit];
      expect(url).toContain("remove");
    });

    it("decrements by step when item quantity exceeds step", async () => {
      // Item has quantity 3000, learned step is 1000
      const cartWithItem = makeCart({ items: [makeCartItem("v-1", 3000)] });
      const cartAfterAdd = makeCart({ items: [makeCartItem("v-1", 1000)] });
      const cartAfterDecrement = makeCart({ items: [makeCartItem("v-1", 2000)] });

      const fetchMock = vi.fn()
        // First: add() to learn step
        .mockResolvedValueOnce(
          new Response(JSON.stringify(makeMutationResponse(makeCart({ items: [makeCartItem("v-1", 1000)] }))), { status: 200 })
        )
        // Second: load() to set quantity to 3000
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: cartWithItem }), { status: 200 })
        )
        // Third: decrement call
        .mockResolvedValueOnce(
          new Response(JSON.stringify(makeMutationResponse(cartAfterDecrement)), { status: 200 })
        );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient();
      const manager = new CartManager(client);

      // Learn step via add (0 -> 1000 = step of 1000)
      await manager.add("v-1", 1);
      // Load with higher quantity
      await manager.load();
      // Decrement
      await manager.decrement("v-1");

      const [, init] = fetchMock.mock.calls[2] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.quantity).toBe(1000);
    });

    it("sets error on failure", async () => {
      const cartWithItem = makeCart({ items: [makeCartItem("v-1", 3000)] });
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: cartWithItem }), { status: 200 })
        )
        .mockRejectedValueOnce(new Error("Fail"));
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.load();

      await expect(manager.decrement("v-1")).rejects.toThrow("Fail");
      expect(manager.error).toBeInstanceOf(Error);
      expect(manager.isLoading).toBe(false);
    });
  });

  describe("setQuantity()", () => {
    it("sends exact quantity in API format", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(makeCart({
          items: [makeCartItem("v-1", 5000)],
        }))), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.setQuantity("v-1", 5);

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.variant_uuid).toBe("v-1");
      expect(body.quantity).toBe(5000);
    });

    it("updates cart state after success", async () => {
      const updatedCart = makeCart({
        items: [makeCartItem("v-1", 3000, 500)],
        regular_price: 1500,
        final_price: 1500,
      });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(updatedCart)), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.setQuantity("v-1", 3);

      expect(manager.cart).toEqual(updatedCart);
    });

    it("sets error on failure", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("Fail"));
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);

      await expect(manager.setQuantity("v-1", 5)).rejects.toThrow("Fail");
      expect(manager.error).toBeInstanceOf(Error);
      expect(manager.isLoading).toBe(false);
    });
  });

  describe("applyDiscount()", () => {
    it("applies discount code and updates state", async () => {
      const discountedCart = makeCart({
        discount: { code: "SAVE10", percentage_discount: 10, source: "discount_codes" },
        regular_price: 1000,
        final_price: 900,
      });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(discountedCart)), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.applyDiscount("SAVE10");

      expect(manager.hasDiscount).toBe(true);
      expect(manager.discount).toEqual({
        code: "SAVE10",
        percentage_discount: 10,
        source: "discount_codes",
      });
      expect(manager.finalPrice).toBe(900);
    });

    it("sets error on failure", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("Invalid code"));
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);

      await expect(manager.applyDiscount("BAD")).rejects.toThrow("Invalid code");
      expect(manager.error).toBeInstanceOf(Error);
      expect(manager.isLoading).toBe(false);
    });
  });

  describe("removeDiscount()", () => {
    it("removes discount and updates state", async () => {
      const cartWithoutDiscount = makeCart({
        regular_price: 1000,
        final_price: 1000,
      });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(makeMutationResponse(cartWithoutDiscount)), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.removeDiscount();

      expect(manager.hasDiscount).toBe(false);
      expect(manager.discount).toBeNull();
    });

    it("sets error on failure", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("Fail"));
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);

      await expect(manager.removeDiscount()).rejects.toThrow("Fail");
      expect(manager.error).toBeInstanceOf(Error);
    });
  });

  describe("clear()", () => {
    it("resets cart to null", async () => {
      const cartData = makeCart({ items: [makeCartItem("v-1")] });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.load();

      expect(manager.cart).not.toBeNull();
      manager.clear();

      expect(manager.cart).toBeNull();
      expect(manager.isLoading).toBe(false);
      expect(manager.error).toBeNull();
    });

    it("removes token from localStorage", () => {
      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      manager.clear();

      expect(mockStorage.removeItem).toHaveBeenCalledWith("spaceis_cart_shop-uuid-abc");
    });

    it("clears cart token from client", () => {
      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      manager.clear();

      expect(client.cartToken).toBeUndefined();
    });

    it("notifies listeners", () => {
      const client = makeClient();
      const manager = new CartManager(client);
      const listener = vi.fn();
      manager.onChange(listener);
      listener.mockClear();

      manager.clear();

      expect(listener).toHaveBeenCalledWith(null);
    });
  });

  describe("onChange()", () => {
    it("fires listener immediately with current state", () => {
      const manager = new CartManager(makeClient());
      const listener = vi.fn();

      manager.onChange(listener);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(null);
    });

    it("returns unsubscribe function", () => {
      const manager = new CartManager(makeClient());
      const listener = vi.fn();

      const unsubscribe = manager.onChange(listener);
      expect(typeof unsubscribe).toBe("function");

      listener.mockClear();
      unsubscribe();

      // After unsubscribe, clear should not notify this listener
      manager.clear();
      expect(listener).not.toHaveBeenCalled();
    });

    it("supports multiple listeners", async () => {
      const cartData = makeCart({ items: [makeCartItem("v-1")] });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      manager.onChange(listener1);
      manager.onChange(listener2);
      listener1.mockClear();
      listener2.mockClear();

      await manager.load();

      expect(listener1.mock.calls.length).toBeGreaterThan(0);
      expect(listener2.mock.calls.length).toBeGreaterThan(0);
    });

    it("does not break notify chain if a listener throws", async () => {
      const cartData = makeCart();
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      const normalListener = vi.fn();

      // Register normal listener first (onChange fires immediately)
      manager.onChange(normalListener);
      normalListener.mockClear();

      // Register throwing listener — catch immediate call
      const throwingListener = vi.fn(() => { throw new Error("listener error"); });
      try { manager.onChange(throwingListener); } catch {}
      throwingListener.mockClear();

      await manager.load();

      // Normal listener should still be called despite the throwing one in notify()
      expect(normalListener.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe("computed properties", () => {
    it("itemCount returns number of unique items", async () => {
      const cartData = makeCart({
        items: [
          makeCartItem("v-1", 2000),
          makeCartItem("v-2", 3000),
        ],
      });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.load();

      expect(manager.itemCount).toBe(2);
    });

    it("totalQuantity converts from API format", async () => {
      const cartData = makeCart({
        items: [
          makeCartItem("v-1", 2000),  // 2 items
          makeCartItem("v-2", 3000),  // 3 items
        ],
      });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.load();

      expect(manager.totalQuantity).toBe(5);
    });

    it("finalPrice returns cart final_price", async () => {
      const cartData = makeCart({ final_price: 2500 });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.load();

      expect(manager.finalPrice).toBe(2500);
    });

    it("regularPrice returns cart regular_price", async () => {
      const cartData = makeCart({ regular_price: 3000 });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.load();

      expect(manager.regularPrice).toBe(3000);
    });

    it("hasDiscount returns true when discount exists", async () => {
      const cartData = makeCart({
        discount: { code: "SAVE", percentage_discount: 15, source: "discount_codes" },
      });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.load();

      expect(manager.hasDiscount).toBe(true);
    });

    it("hasDiscount returns false when no discount", async () => {
      const cartData = makeCart({ discount: null });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.load();

      expect(manager.hasDiscount).toBe(false);
    });

    it("isEmpty returns false when cart has items", async () => {
      const cartData = makeCart({ items: [makeCartItem("v-1")] });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.load();

      expect(manager.isEmpty).toBe(false);
    });

    it("isEmpty returns true when cart has no items", async () => {
      const cartData = makeCart({ items: [] });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.load();

      expect(manager.isEmpty).toBe(true);
    });

    it("findItem returns the matching cart item", async () => {
      const item = makeCartItem("v-1", 2000);
      const cartData = makeCart({ items: [item] });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.load();

      expect(manager.findItem("v-1")).toEqual(item);
      expect(manager.findItem("nonexistent")).toBeNull();
    });

    it("hasItem checks if variant exists in cart", async () => {
      const cartData = makeCart({ items: [makeCartItem("v-1")] });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.load();

      expect(manager.hasItem("v-1")).toBe(true);
      expect(manager.hasItem("v-999")).toBe(false);
    });

    it("getQuantity returns human-readable quantity", async () => {
      const cartData = makeCart({ items: [makeCartItem("v-1", 2500)] });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      const manager = new CartManager(client);
      await manager.load();

      expect(manager.getQuantity("v-1")).toBe(2.5);
      expect(manager.getQuantity("nonexistent")).toBe(0);
    });
  });

  describe("autoLoad option", () => {
    it("calls load() automatically when autoLoad is true", async () => {
      const cartData = makeCart({ items: [makeCartItem("v-1")] });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: cartData }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      new CartManager(client, { autoLoad: true });

      // Wait for the auto-load to complete
      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });
    });

    it("does not call load() when autoLoad is false", () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const client = makeClient({ cartToken: "token" });
      new CartManager(client, { autoLoad: false });

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
