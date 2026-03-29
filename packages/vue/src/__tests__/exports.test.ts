import { describe, it, expect } from "vitest";
import * as VueSDK from "../index";

describe("@spaceis/vue exports", () => {
  // ── Plugin ──────────────────────────────────────────────────────────────────
  it("exports SpaceISPlugin", () => {
    expect(VueSDK.SpaceISPlugin).toBeDefined();
    expect(VueSDK.SpaceISPlugin.install).toBeTypeOf("function");
  });

  it("exports SpaceISKey injection key", () => {
    expect(VueSDK.SpaceISKey).toBeDefined();
    expect(typeof VueSDK.SpaceISKey).toBe("symbol");
  });

  // ── Composables ─────────────────────────────────────────────────────────────
  const composables = [
    "useSpaceIS",
    "useCart",
    "useProducts",
    "useProduct",
    "useProductRecommendations",
    "useCategories",
    "usePackages",
    "useSales",
    "useGoals",
    "useTopCustomers",
    "useLatestOrders",
    "useShopConfig",
    "usePaymentMethods",
    "useAgreements",
    "usePlaceOrder",
    "useCheckout",
    "useRecaptcha",
    "usePages",
    "usePage",
    "useStatute",
  ] as const;

  it.each(composables)("exports %s composable", (name) => {
    expect((VueSDK as Record<string, unknown>)[name]).toBeTypeOf("function");
  });

  // ── SDK re-exports ──────────────────────────────────────────────────────────
  const sdkUtils = [
    "SpaceISError",
    "formatPrice",
    "fromApiQty",
    "toApiQty",
    "getItemQty",
    "getProductLimits",
    "getCartItemImage",
    "snapQuantity",
    "centsToAmount",
    "escapeHtml",
  ] as const;

  it.each(sdkUtils)("re-exports %s from @spaceis/sdk", (name) => {
    expect((VueSDK as Record<string, unknown>)[name]).toBeDefined();
  });
});
