import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import { createSpaceIS } from "@spaceis/sdk";
import { SpaceISKey } from "../plugin";
import { useProducts } from "../composables/use-products";
import { useProduct } from "../composables/use-product";
import { useCategories } from "../composables/use-categories";
import { useSales } from "../composables/use-sales";
import { useShopConfig } from "../composables/use-shop-config";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function mockApiResponse(json: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(json),
  });
}

function mountWithContext(setup: () => unknown) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const client = createSpaceIS({
    baseUrl: "https://api.example.com",
    shopUuid: "test-shop-uuid",
  });
  // cartManager is not needed for data composables — provide a minimal stub
  const cartManager = {
    cart: null,
    isLoading: false,
    error: null,
    onChange: vi.fn(() => vi.fn()),
    load: vi.fn(),
  } as unknown as import("@spaceis/sdk").CartManager;

  const Comp = defineComponent({
    setup() {
      const result = setup();
      return { result };
    },
    render() {
      return h("div");
    },
  });

  return mount(Comp, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient: qc }]],
      provide: { [SpaceISKey as symbol]: { client, cartManager } },
    },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
});

describe("data composables", () => {
  it("useProducts fetches product list", async () => {
    const apiResponse = { data: [{ uuid: "1", name: "Test Product" }], meta: { current_page: 1, last_page: 1 } };
    mockApiResponse(apiResponse);

    const wrapper = mountWithContext(() => useProducts({ page: 1 }));
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("/products");
    wrapper.unmount();
  });

  it("useCategories fetches categories", async () => {
    const categories = [{ uuid: "1", name: "VIP", is_active: true }];
    mockApiResponse({ data: categories });

    const wrapper = mountWithContext(() => useCategories());
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("/categories");
    wrapper.unmount();
  });

  it("useProduct is disabled when slug is null", async () => {
    const wrapper = mountWithContext(() => useProduct(null));
    await flushPromises();

    // Should not make any fetch call when slug is null
    expect(mockFetch).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("useProduct fetches when slug is provided", async () => {
    const product = { uuid: "1", name: "Test", slug: "test" };
    mockApiResponse({ data: product });

    const wrapper = mountWithContext(() => useProduct("test"));
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("/products/test");
    wrapper.unmount();
  });

  it("useSales fetches sales list", async () => {
    const apiResponse = { data: [{ uuid: "1", name: "Summer Sale" }], meta: {} };
    mockApiResponse(apiResponse);

    const wrapper = mountWithContext(() => useSales());
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("/sales");
    wrapper.unmount();
  });

  it("useShopConfig fetches config", async () => {
    const config = { meta: { accent_color: "#000" } };
    mockApiResponse({ data: config });

    const wrapper = mountWithContext(() => useShopConfig());
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("/template");
    wrapper.unmount();
  });
});
