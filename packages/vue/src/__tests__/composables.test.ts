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
