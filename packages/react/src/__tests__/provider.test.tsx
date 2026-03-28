import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
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
    const { QueryClient } = require("@tanstack/react-query");
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
});
