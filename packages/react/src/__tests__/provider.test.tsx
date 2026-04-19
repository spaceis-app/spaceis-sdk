import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { SpaceISProvider, useSpaceIS } from "../provider";
import type { ReactNode } from "react";

function makeWrapper(config?: Partial<{ baseUrl: string; shopUuid: string }>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SpaceISProvider
        config={{
          baseUrl: config?.baseUrl ?? "https://api.example.com",
          shopUuid: config?.shopUuid ?? "test-shop-uuid",
        }}
      >
        {children}
      </SpaceISProvider>
    );
  };
}

describe("SpaceISProvider", () => {
  it("provides client and cartManager via useSpaceIS", () => {
    const { result } = renderHook(() => useSpaceIS(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.client).toBeDefined();
    expect(result.current.cartManager).toBeDefined();
  });

  it("client has all expected modules", () => {
    const { result } = renderHook(() => useSpaceIS(), {
      wrapper: makeWrapper(),
    });

    const { client } = result.current;
    expect(client.products).toBeDefined();
    expect(client.categories).toBeDefined();
    expect(client.cart).toBeDefined();
    expect(client.checkout).toBeDefined();
    expect(client.orders).toBeDefined();
    expect(client.sales).toBeDefined();
    expect(client.goals).toBeDefined();
    expect(client.packages).toBeDefined();
    expect(client.content).toBeDefined();
    expect(client.vouchers).toBeDefined();
    expect(client.dailyRewards).toBeDefined();
    expect(client.rankings).toBeDefined();
    expect(client.shop).toBeDefined();
    expect(client.recaptcha).toBeDefined();
  });

  it("throws when useSpaceIS is called outside of provider", () => {
    expect(() => {
      renderHook(() => useSpaceIS());
    }).toThrow("useSpaceIS must be used within <SpaceISProvider>");
  });

  it("returns stable references across re-renders", () => {
    const { result, rerender } = renderHook(() => useSpaceIS(), {
      wrapper: makeWrapper(),
    });

    const first = result.current;
    rerender();
    const second = result.current;

    expect(first.client).toBe(second.client);
    expect(first.cartManager).toBe(second.cartManager);
  });

  it("accepts a custom QueryClient", () => {
    const customQc = new QueryClient();

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <SpaceISProvider
          config={{
            baseUrl: "https://api.example.com",
            shopUuid: "test-shop-uuid",
          }}
          queryClient={customQc}
        >
          {children}
        </SpaceISProvider>
      );
    }

    const { result } = renderHook(() => useSpaceIS(), { wrapper: Wrapper });
    expect(result.current.client).toBeDefined();
  });

  // Fix 1 — lazy useRef pattern for QueryClient
  it("returns stable QueryClient identity across re-renders (no useMemo drift)", () => {
    const { result, rerender } = renderHook(() => useQueryClient(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <SpaceISProvider
          config={{ baseUrl: "https://api.example.com", shopUuid: "test-shop-uuid" }}
        >
          {children}
        </SpaceISProvider>
      ),
    });

    const first = result.current;
    rerender();
    rerender();
    expect(result.current).toBe(first);
  });

  it("uses the provided QueryClient instance (not a new one)", () => {
    const customQc = new QueryClient();

    const { result } = renderHook(() => useQueryClient(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <SpaceISProvider
          config={{ baseUrl: "https://api.example.com", shopUuid: "test-shop-uuid" }}
          queryClient={customQc}
        >
          {children}
        </SpaceISProvider>
      ),
    });

    expect(result.current).toBe(customQc);
  });

  // Fix 2 — NODE_ENV guard on console.error
  describe("console.error NODE_ENV guard", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("emits console.error in development when config prop changes", () => {
      let currentConfig = { baseUrl: "https://api.example.com", shopUuid: "shop-1" };

      const { rerender } = renderHook(() => useSpaceIS(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <SpaceISProvider config={currentConfig}>{children}</SpaceISProvider>
        ),
      });

      currentConfig = { baseUrl: "https://api.example.com", shopUuid: "shop-2" };
      rerender();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[SpaceISProvider]")
      );
    });

    it("does NOT emit console.error in production when config prop changes", () => {
      vi.stubEnv("NODE_ENV", "production");

      let currentConfig = { baseUrl: "https://api.example.com", shopUuid: "shop-1" };

      const { rerender } = renderHook(() => useSpaceIS(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <SpaceISProvider config={currentConfig}>{children}</SpaceISProvider>
        ),
      });

      currentConfig = { baseUrl: "https://api.example.com", shopUuid: "shop-2" };
      rerender();

      expect(console.error).not.toHaveBeenCalled();

      vi.unstubAllEnvs();
    });
  });
});
