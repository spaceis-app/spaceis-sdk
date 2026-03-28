import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { SpaceISProvider } from "../provider";
import { useProducts } from "../hooks/use-products";
import { useProduct } from "../hooks/use-product";
import { useCategories } from "../hooks/use-categories";
import { useSales } from "../hooks/use-sales";
import { usePackages } from "../hooks/use-packages";
import { useGoals } from "../hooks/use-goals";
import { usePages, usePage, useStatute } from "../hooks/use-content";
import { useShopConfig } from "../hooks/use-shop-config";
import { usePaymentMethods, useAgreements, useCheckout } from "../hooks/use-checkout";
import { useRecaptcha } from "../hooks/use-recaptcha";
import { useTopCustomers, useLatestOrders } from "../hooks/use-rankings";
import type { ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function makeWrapper() {
  // Each test gets a fresh QueryClient to avoid cache interference
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SpaceISProvider
        config={{
          baseUrl: "https://api.example.com",
          shopUuid: "test-shop-uuid",
        }}
        queryClient={qc}
      >
        {children}
      </SpaceISProvider>
    );
  };
}

function mockApiResponse(json: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(json),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
});

describe("data hooks", () => {
  it("useProducts fetches product list", async () => {
    const apiResponse = { data: [{ uuid: "1", name: "Test Product" }], meta: { current_page: 1, last_page: 1 } };
    mockApiResponse(apiResponse);

    const { result } = renderHook(() => useProducts({ page: 1 }), {
      wrapper: makeWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(apiResponse);
  });

  it("useProduct is disabled when slug is null", () => {
    const { result } = renderHook(() => useProduct(null), {
      wrapper: makeWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("useProduct fetches when slug is provided", async () => {
    const product = { uuid: "1", name: "Test", slug: "test" };
    mockApiResponse({ data: product });

    const { result } = renderHook(() => useProduct("test"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(product);
  });

  it("useCategories fetches categories", async () => {
    const categories = [{ uuid: "1", name: "VIP", is_active: true }];
    mockApiResponse({ data: categories });

    const { result } = renderHook(() => useCategories(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(categories);
  });

  it("useSales fetches sales", async () => {
    const apiResponse = { data: [{ uuid: "1", name: "Summer Sale" }], meta: {} };
    mockApiResponse(apiResponse);

    const { result } = renderHook(() => useSales(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(apiResponse);
  });

  it("usePackages fetches packages", async () => {
    const apiResponse = { data: [{ uuid: "1", name: "Bundle" }], meta: {} };
    mockApiResponse(apiResponse);

    const { result } = renderHook(() => usePackages(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(apiResponse);
  });

  it("useGoals fetches goals", async () => {
    const apiResponse = { data: [{ uuid: "1", name: "Community Goal" }], meta: {} };
    mockApiResponse(apiResponse);

    const { result } = renderHook(() => useGoals(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(apiResponse);
  });

  it("usePages fetches pages list", async () => {
    const pages = [{ uuid: "1", title: "About", slug: "about" }];
    mockApiResponse({ data: pages });

    const { result } = renderHook(() => usePages(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(pages);
  });

  it("usePage is disabled when slug is null", () => {
    const { result } = renderHook(() => usePage(null), {
      wrapper: makeWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("useStatute fetches statute", async () => {
    const statute = { content: "<p>Terms</p>" };
    mockApiResponse({ data: statute });

    const { result } = renderHook(() => useStatute(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(statute);
  });

  it("useShopConfig fetches config", async () => {
    const config = { meta: { accent_color: "#000" } };
    mockApiResponse({ data: config });

    const { result } = renderHook(() => useShopConfig(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(config);
  });

  it("usePaymentMethods fetches methods", async () => {
    const methods = [{ uuid: "1", name: "PayPal" }];
    mockApiResponse({ data: methods });

    const { result } = renderHook(() => usePaymentMethods(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(methods);
  });

  it("useAgreements fetches agreements", async () => {
    const agreements = [{ uuid: "1", name: "Terms" }];
    mockApiResponse({ data: agreements });

    const { result } = renderHook(() => useAgreements(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(agreements);
  });

  it("useCheckout returns methods, agreements, and placeOrder", () => {
    // useCheckout triggers both usePaymentMethods and useAgreements
    mockApiResponse({ data: [] });
    mockApiResponse({ data: [] });

    const { result } = renderHook(() => useCheckout(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.methods).toBeDefined();
    expect(result.current.agreements).toBeDefined();
    expect(result.current.placeOrder).toBeDefined();
    expect(typeof result.current.placeOrder.mutate).toBe("function");
  });

  it("useRecaptcha returns execute function", () => {
    const { result } = renderHook(() => useRecaptcha(), {
      wrapper: makeWrapper(),
    });

    expect(typeof result.current.execute).toBe("function");
  });

  it("useTopCustomers fetches top customers", async () => {
    const customers = [
      { username: "Steve", total_spent: 5000 },
      { username: "Alex", total_spent: 3000 },
    ];
    mockApiResponse({ data: customers });

    const { result } = renderHook(() => useTopCustomers({ limit: 10 }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(customers);
  });

  it("useLatestOrders fetches latest orders", async () => {
    const orders = [
      { uuid: "order-1", username: "Steve" },
      { uuid: "order-2", username: "Alex" },
    ];
    mockApiResponse({ data: orders });

    const { result } = renderHook(() => useLatestOrders({ limit: 5 }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(orders);
  });
});
