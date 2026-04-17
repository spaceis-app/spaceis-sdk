import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { SpaceISProvider } from "../provider";
import { useCart } from "../hooks/use-cart";
import type { ReactNode } from "react";

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock localStorage
const storage = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
});

function makeWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SpaceISProvider
        config={{
          baseUrl: "https://api.example.com",
          shopUuid: "test-shop-uuid",
        }}
      >
        {children}
      </SpaceISProvider>
    );
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  storage.clear();
  mockFetch.mockReset();
});

describe("useCart", () => {
  it("returns initial empty state", () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.cart).toBeNull();
    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.totalQuantity).toBe(0);
    expect(result.current.finalPrice).toBe(0);
    expect(result.current.regularPrice).toBe(0);
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasDiscount).toBe(false);
    expect(result.current.discount).toBeNull();
  });

  it("exposes all expected action methods", () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: makeWrapper(),
    });

    expect(typeof result.current.load).toBe("function");
    expect(typeof result.current.add).toBe("function");
    expect(typeof result.current.remove).toBe("function");
    expect(typeof result.current.increment).toBe("function");
    expect(typeof result.current.decrement).toBe("function");
    expect(typeof result.current.setQuantity).toBe("function");
    expect(typeof result.current.applyDiscount).toBe("function");
    expect(typeof result.current.removeDiscount).toBe("function");
    expect(typeof result.current.clear).toBe("function");
  });

  it("exposes all expected helper methods", () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: makeWrapper(),
    });

    expect(typeof result.current.findItem).toBe("function");
    expect(typeof result.current.hasItem).toBe("function");
    expect(typeof result.current.getQuantity).toBe("function");
    expect(typeof result.current.formatPrice).toBe("function");
  });

  it("formatPrice formats cents correctly", () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.formatPrice(1299)).toContain("12");
  });

  it("clear resets cart state", () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: makeWrapper(),
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.cart).toBeNull();
    expect(result.current.items).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
  });

  it("add() triggers re-render and updates items state reactively", async () => {
    // CartManager.add() calls client.cart.addItem internally, which calls fetch.
    // The response must be a CartMutationResponse: { message, data: { cart } }
    const cartAfterAdd = {
      items: [
        {
          variant: { uuid: "variant-abc", name: "Test Item" },
          quantity: 1000,
          regular_price: 1000,
          final_price: 1000,
        },
      ],
      discount: null,
      regular_price: 1000,
      final_price: 1000,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ message: "Added", data: { cart: cartAfterAdd } }),
    });

    const { result } = renderHook(() => useCart(), { wrapper: makeWrapper() });

    expect(result.current.cart).toBeNull();
    expect(result.current.isEmpty).toBe(true);

    await act(async () => {
      await result.current.add("variant-abc");
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.isEmpty).toBe(false);
    // quantity 1000 in API units = 1 human-readable
    expect(result.current.totalQuantity).toBe(1);
  });

  it("clear() after add() empties state and triggers re-render", async () => {
    const cartWithItem = {
      items: [
        {
          variant: { uuid: "variant-xyz", name: "Item" },
          quantity: 1000,
          regular_price: 500,
          final_price: 500,
        },
      ],
      discount: null,
      regular_price: 500,
      final_price: 500,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ message: "Added", data: { cart: cartWithItem } }),
    });

    const { result } = renderHook(() => useCart(), { wrapper: makeWrapper() });

    await act(async () => {
      await result.current.add("variant-xyz");
    });

    expect(result.current.items).toHaveLength(1);

    act(() => {
      result.current.clear();
    });

    expect(result.current.cart).toBeNull();
    expect(result.current.items).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.totalQuantity).toBe(0);
  });
});
