import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import { createSpaceIS } from "@spaceis/sdk";
import type { CartManager } from "@spaceis/sdk";
import { SpaceISKey } from "../plugin";
import { useProducts } from "../composables/use-products";
import { useProduct } from "../composables/use-product";
import { useCategories } from "../composables/use-categories";
import { useSales } from "../composables/use-sales";
import { useShopConfig } from "../composables/use-shop-config";
import { usePlaceOrder } from "../composables/use-checkout";
import { useProductRecommendations } from "../composables/use-product";
import { useCart } from "../composables/use-cart";
import { useRecaptcha } from "../composables/use-recaptcha";
import { useTopCustomers, useLatestOrders } from "../composables/use-rankings";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function mockApiResponse(json: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(json),
  });
}

function makeClient() {
  return createSpaceIS({
    baseUrl: "https://api.example.com",
    shopUuid: "test-shop-uuid",
  });
}

function makeCartManagerStub(overrides: Partial<CartManager> = {}): CartManager {
  return {
    cart: null,
    isLoading: false,
    error: null,
    onChange: vi.fn(() => vi.fn()),
    load: vi.fn(),
    clear: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    increment: vi.fn(),
    decrement: vi.fn(),
    setQuantity: vi.fn(),
    applyDiscount: vi.fn(),
    removeDiscount: vi.fn(),
    findItem: vi.fn(() => null),
    hasItem: vi.fn(() => false),
    getQuantity: vi.fn(() => 0),
    formatPrice: vi.fn(() => ""),
    ...overrides,
  } as unknown as CartManager;
}

function mountWithContext(setup: () => unknown, cartManager?: CartManager | null) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const client = makeClient();
  const cm = cartManager !== undefined ? cartManager : makeCartManagerStub();

  const Comp = defineComponent({
    setup() {
      const result = setup();
      return { result };
    },
    render() {
      return h("div");
    },
  });

  const wrapper = mount(Comp, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient: qc }]],
      provide: { [SpaceISKey as symbol]: { client, cartManager: cm } },
    },
  });

  return { wrapper, qc, cartManager: cm };
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
});

describe("data composables", () => {
  it("useProducts fetches product list", async () => {
    const apiResponse = { data: [{ uuid: "1", name: "Test Product" }], meta: { current_page: 1, last_page: 1 } };
    mockApiResponse(apiResponse);

    const { wrapper } = mountWithContext(() => useProducts({ page: 1 }));
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("/products");
    wrapper.unmount();
  });

  it("useCategories fetches categories", async () => {
    const categories = [{ uuid: "1", name: "VIP", is_active: true }];
    mockApiResponse({ data: categories });

    const { wrapper } = mountWithContext(() => useCategories());
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("/categories");
    wrapper.unmount();
  });

  it("useProduct is disabled when slug is null", async () => {
    const { wrapper } = mountWithContext(() => useProduct(null));
    await flushPromises();

    // Should not make any fetch call when slug is null
    expect(mockFetch).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("useProduct fetches when slug is provided", async () => {
    const product = { uuid: "1", name: "Test", slug: "test" };
    mockApiResponse({ data: product });

    const { wrapper } = mountWithContext(() => useProduct("test"));
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("/products/test");
    wrapper.unmount();
  });

  it("useSales fetches sales list", async () => {
    const apiResponse = { data: [{ uuid: "1", name: "Summer Sale" }], meta: {} };
    mockApiResponse(apiResponse);

    const { wrapper } = mountWithContext(() => useSales());
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("/sales");
    wrapper.unmount();
  });

  it("useShopConfig fetches config", async () => {
    const config = { meta: { accent_color: "#000" } };
    mockApiResponse({ data: config });

    const { wrapper } = mountWithContext(() => useShopConfig());
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("/template");
    wrapper.unmount();
  });
});

describe("MaybeRefOrGetter compatibility — getter functions as params", () => {
  it("useProducts accepts a getter function for params", async () => {
    const apiResponse = { data: [{ uuid: "g1", name: "Getter Product" }], meta: { current_page: 1, last_page: 1 } };
    mockApiResponse(apiResponse);

    const getter = () => ({ page: 1 as const });

    const { wrapper } = mountWithContext(() => useProducts(getter));
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("/products");
    wrapper.unmount();
  });

  it("useProduct accepts a getter function for slug", async () => {
    const product = { uuid: "g2", name: "Getter Product", slug: "getter-slug" };
    mockApiResponse({ data: product });

    const getter = () => "getter-slug";

    const { wrapper } = mountWithContext(() => useProduct(getter));
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("/products/getter-slug");
    wrapper.unmount();
  });

  it("useProductRecommendations accepts a getter function for slug", async () => {
    const recommendations = [{ uuid: "pkg1", name: "Bundle A" }];
    mockApiResponse({ data: recommendations });

    const getter = () => "some-slug";

    const { wrapper } = mountWithContext(() => useProductRecommendations(getter));
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("/products/some-slug/package-recommendations");
    wrapper.unmount();
  });
});

describe("usePlaceOrder — auto cart clear", () => {
  it("calls cartManager.clear() and invalidates ['spaceis', 'cart'] on success", async () => {
    // Mock placeOrder success response
    mockApiResponse({ data: { order_code: "ORD-001" } });

    const clearSpy = vi.fn();
    const cm = makeCartManagerStub({ clear: clearSpy });
    let capturedMutation: ReturnType<typeof usePlaceOrder> | undefined;

    const { wrapper, qc } = mountWithContext(() => {
      capturedMutation = usePlaceOrder();
      return capturedMutation;
    }, cm);

    // Pre-populate cache so we can verify invalidation
    qc.setQueryData(["spaceis", "cart"], { items: [], final_price: 0 });
    expect(qc.getQueryData(["spaceis", "cart"])).toBeDefined();

    // Trigger the mutation
    capturedMutation!.mutate({
      payment_method_uuid: "pm-uuid-1",
      email: "user@example.com",
      first_name: "testuser",
      "g-recaptcha-response": "token",
    });

    await flushPromises();

    // cartManager.clear() should have been called
    expect(clearSpy).toHaveBeenCalledTimes(1);

    // Query should be invalidated (stale)
    const cartQuery = qc.getQueryCache().find({ queryKey: ["spaceis", "cart"] });
    expect(cartQuery?.isStale()).toBe(true);

    wrapper.unmount();
  });

  it("works safely when cartManager is null (SSR context)", async () => {
    // Mock placeOrder success response
    mockApiResponse({ data: { order_code: "ORD-002" } });

    let capturedMutation: ReturnType<typeof usePlaceOrder> | undefined;

    // Pass null as cartManager (SSR scenario)
    const { wrapper } = mountWithContext(() => {
      capturedMutation = usePlaceOrder();
      return capturedMutation;
    }, null);

    // Should not throw even with null cartManager
    capturedMutation!.mutate({
      payment_method_uuid: "pm-uuid-1",
      email: "user@example.com",
      first_name: "testuser",
      "g-recaptcha-response": "token",
    });

    await flushPromises();

    // Mutation completed without throwing
    expect(capturedMutation!.isSuccess.value).toBe(true);

    wrapper.unmount();
  });

  it("fires user-level onSuccess callback after hook-level auto-clear", async () => {
    mockApiResponse({ data: { order_code: "ORD-003" } });

    const userOnSuccess = vi.fn();
    let capturedMutation: ReturnType<typeof usePlaceOrder> | undefined;

    const { wrapper } = mountWithContext(() => {
      capturedMutation = usePlaceOrder();
      return capturedMutation;
    });

    capturedMutation!.mutate(
      { payment_method_uuid: "pm-uuid-1", email: "user@example.com", first_name: "testuser", "g-recaptcha-response": "token" },
      { onSuccess: userOnSuccess }
    );

    await flushPromises();

    expect(userOnSuccess).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });
});

describe("useCart", () => {
  it("returns refs and computed props with correct initial values", () => {
    const cartStub = makeCartManagerStub();
    let captured: ReturnType<typeof useCart> | undefined;

    const { wrapper } = mountWithContext(() => {
      captured = useCart();
      return captured;
    }, cartStub);

    expect(captured).toBeDefined();
    // ShallowRefs
    expect(captured!.cart.value).toBeNull();
    expect(captured!.isLoading.value).toBe(false);
    expect(captured!.error.value).toBeNull();
    // ComputedRefs derived from null cart
    expect(captured!.isEmpty.value).toBe(true);
    expect(captured!.items.value).toEqual([]);
    expect(captured!.itemCount.value).toBe(0);
    expect(captured!.totalQuantity.value).toBe(0);
    expect(captured!.finalPrice.value).toBe(0);
    expect(captured!.regularPrice.value).toBe(0);
    expect(captured!.hasDiscount.value).toBe(false);

    wrapper.unmount();
  });

  it("exposes all cart action methods", () => {
    let captured: ReturnType<typeof useCart> | undefined;

    const { wrapper } = mountWithContext(() => {
      captured = useCart();
      return captured;
    });

    expect(typeof captured!.load).toBe("function");
    expect(typeof captured!.add).toBe("function");
    expect(typeof captured!.remove).toBe("function");
    expect(typeof captured!.increment).toBe("function");
    expect(typeof captured!.decrement).toBe("function");
    expect(typeof captured!.setQuantity).toBe("function");
    expect(typeof captured!.applyDiscount).toBe("function");
    expect(typeof captured!.removeDiscount).toBe("function");
    expect(typeof captured!.clear).toBe("function");
    expect(typeof captured!.findItem).toBe("function");
    expect(typeof captured!.hasItem).toBe("function");
    expect(typeof captured!.getQuantity).toBe("function");
    expect(typeof captured!.formatPrice).toBe("function");

    wrapper.unmount();
  });
});

describe("useRecaptcha", () => {
  it("returns an execute function", () => {
    let captured: ReturnType<typeof useRecaptcha> | undefined;

    const { wrapper } = mountWithContext(() => {
      captured = useRecaptcha();
      return captured;
    });

    expect(typeof captured!.execute).toBe("function");

    wrapper.unmount();
  });

  it("execute() rejects when called outside browser (no window)", async () => {
    let captured: ReturnType<typeof useRecaptcha> | undefined;

    const { wrapper } = mountWithContext(() => {
      captured = useRecaptcha();
      return captured;
    });

    // Simulate non-browser environment by removing window temporarily
    const originalWindow = globalThis.window;
    // @ts-expect-error — intentionally deleting window to simulate SSR
    delete globalThis.window;

    await expect(captured!.execute("checkout")).rejects.toThrow(
      "useRecaptcha can only be used on the client"
    );

    // Restore
    globalThis.window = originalWindow;
    wrapper.unmount();
  });
});

describe("useTopCustomers", () => {
  it("fetches top customers and exposes data", async () => {
    // RankingsModule.top() unwraps res.data — so data.value is the array directly
    const topCustomers = [
      {
        first_name: "steve",
        total_orders: 5,
        total_items: 10,
        total_items_quantity: 10000,
        total_spent: 5000,
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: topCustomers }),
    });

    let captured: ReturnType<typeof useTopCustomers> | undefined;

    const { wrapper } = mountWithContext(() => {
      captured = useTopCustomers({ limit: 10 });
      return captured;
    });

    await flushPromises();

    expect(captured!.isSuccess.value).toBe(true);
    const data = captured!.data.value as typeof topCustomers;
    expect(data).toHaveLength(1);
    expect(data[0]!.first_name).toBe("steve");
    expect(data[0]!.total_spent).toBe(5000);

    wrapper.unmount();
  });
});

describe("useLatestOrders", () => {
  it("fetches latest orders and exposes data", async () => {
    // RankingsModule.latest() unwraps res.data — so data.value is the array directly
    // LatestOrder type: { first_name: string, completed_at: string }
    const latestOrders = [
      {
        first_name: "player1",
        completed_at: "2026-01-01T12:00:00Z",
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: latestOrders }),
    });

    let captured: ReturnType<typeof useLatestOrders> | undefined;

    const { wrapper } = mountWithContext(() => {
      captured = useLatestOrders({ limit: 5 });
      return captured;
    });

    await flushPromises();

    expect(captured!.isSuccess.value).toBe(true);
    const data = captured!.data.value;
    expect(data).toHaveLength(1);
    expect(data![0]!.first_name).toBe("player1");
    expect(data![0]!.completed_at).toBe("2026-01-01T12:00:00Z");

    wrapper.unmount();
  });
});
