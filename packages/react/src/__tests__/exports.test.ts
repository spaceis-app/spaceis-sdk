import { describe, it, expect } from "vitest";
import * as ReactExports from "../index";

describe("@spaceis/react exports", () => {
  it("exports SpaceISProvider", () => {
    expect(ReactExports.SpaceISProvider).toBeDefined();
    expect(typeof ReactExports.SpaceISProvider).toBe("function");
  });

  it("exports useSpaceIS", () => {
    expect(typeof ReactExports.useSpaceIS).toBe("function");
  });

  it("exports all data hooks", () => {
    expect(typeof ReactExports.useProducts).toBe("function");
    expect(typeof ReactExports.useProduct).toBe("function");
    expect(typeof ReactExports.useProductRecommendations).toBe("function");
    expect(typeof ReactExports.useCategories).toBe("function");
    expect(typeof ReactExports.usePackages).toBe("function");
    expect(typeof ReactExports.useSales).toBe("function");
    expect(typeof ReactExports.useGoals).toBe("function");
    expect(typeof ReactExports.useTopCustomers).toBe("function");
    expect(typeof ReactExports.useLatestOrders).toBe("function");
    expect(typeof ReactExports.useShopConfig).toBe("function");
  });

  it("exports checkout hooks", () => {
    expect(typeof ReactExports.usePaymentMethods).toBe("function");
    expect(typeof ReactExports.useAgreements).toBe("function");
    expect(typeof ReactExports.usePlaceOrder).toBe("function");
    expect(typeof ReactExports.useCheckout).toBe("function");
  });

  it("exports cart and utility hooks", () => {
    expect(typeof ReactExports.useCart).toBe("function");
    expect(typeof ReactExports.useRecaptcha).toBe("function");
  });

  it("exports content hooks", () => {
    expect(typeof ReactExports.usePages).toBe("function");
    expect(typeof ReactExports.usePage).toBe("function");
    expect(typeof ReactExports.useStatute).toBe("function");
  });

  it("re-exports SDK utilities", () => {
    expect(typeof ReactExports.formatPrice).toBe("function");
    expect(typeof ReactExports.fromApiQty).toBe("function");
    expect(typeof ReactExports.toApiQty).toBe("function");
    expect(typeof ReactExports.getItemQty).toBe("function");
    expect(typeof ReactExports.getProductLimits).toBe("function");
    expect(typeof ReactExports.getCartItemImage).toBe("function");
    expect(typeof ReactExports.centsToAmount).toBe("function");
    expect(typeof ReactExports.escapeHtml).toBe("function");
  });

  it("re-exports SpaceISError class", () => {
    expect(ReactExports.SpaceISError).toBeDefined();
  });
});
