import { describe, it, expect, vi, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { SpaceISProvider } from "@spaceis/react";
import type { CartItem } from "@spaceis/react";
import { CartItemRow } from "@/features/cart/CartItemRow";

// Mock next/link (same pattern as components.test.tsx)
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Suppress fetch errors from cart autoLoad — we don't need a real API
beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    })
  );
});

function TestProvider({ children }: { children: React.ReactNode }) {
  return (
    <SpaceISProvider
      config={{ baseUrl: "http://test", shopUuid: "test-shop" }}
      cartOptions={{ autoLoad: false }}
    >
      {children}
    </SpaceISProvider>
  );
}

const baseItem: CartItem = {
  shop_product: {
    uuid: "p1",
    name: "VIP Rank",
    slug: "vip",
    image: null,
    price: 1000,
  },
  variant: {
    uuid: "v1",
    name: "VIP Rank",
    image: null,
    price: 1000,
  },
  package: null,
  from_package: null,
  quantity: 1000,
  cart_item_sale: null,
  regular_price: 1000,
  regular_price_value: 1000,
  final_price: 1000,
  final_price_value: 1000,
};

describe("CartItemRow — content", () => {
  it("renders product name", () => {
    const { container } = render(
      <TestProvider>
        <CartItemRow item={baseItem} layout="drawer" />
      </TestProvider>
    );
    expect(container.textContent).toContain("VIP Rank");
  });

  it("shows variant name when variant.name differs from shop_product.name", () => {
    const item: CartItem = {
      ...baseItem,
      variant: { ...baseItem.variant, name: "Gold Edition" },
    };
    const { container } = render(
      <TestProvider>
        <CartItemRow item={item} layout="drawer" />
      </TestProvider>
    );
    expect(container.textContent).toContain("Gold Edition");
  });

  it("hides variant name when variant.name matches shop_product.name", () => {
    // baseItem already has matching names
    const { container } = render(
      <TestProvider>
        <CartItemRow item={baseItem} layout="drawer" />
      </TestProvider>
    );
    const variantEls = container.querySelectorAll(".cart-item-variant");
    expect(variantEls.length).toBe(0);
  });

  it("renders package badge when item.package is present", () => {
    const item: CartItem = {
      ...baseItem,
      package: {
        uuid: "pkg1",
        name: "Starter Pack",
        included_variants: [],
      },
    };
    const { container } = render(
      <TestProvider>
        <CartItemRow item={item} layout="drawer" />
      </TestProvider>
    );
    expect(container.textContent).toContain("Starter Pack");
  });

  it("does not render package section when item.package is null", () => {
    const { container } = render(
      <TestProvider>
        <CartItemRow item={baseItem} layout="drawer" />
      </TestProvider>
    );
    expect(container.querySelector(".cart-item-package")).toBeFalsy();
  });

  it("shows placeholder when shop_product.image is null and variant.image is null", () => {
    const { container } = render(
      <TestProvider>
        <CartItemRow item={baseItem} layout="drawer" />
      </TestProvider>
    );
    // No real <img> element — placeholder div with SVG instead
    expect(container.querySelector("img")).toBeFalsy();
    expect(container.querySelector(".cart-item-img-placeholder")).toBeTruthy();
  });

  it("shows image when shop_product.image is set", () => {
    const item: CartItem = {
      ...baseItem,
      shop_product: { ...baseItem.shop_product, image: "https://example.com/img.png" },
    };
    const { container } = render(
      <TestProvider>
        <CartItemRow item={item} layout="drawer" />
      </TestProvider>
    );
    const img = container.querySelector("img") as HTMLImageElement | null;
    expect(img).toBeTruthy();
    expect(img?.src).toBe("https://example.com/img.png");
  });

  it("has aria-label Remove {productName} on remove button", () => {
    const { container } = render(
      <TestProvider>
        <CartItemRow item={baseItem} layout="drawer" />
      </TestProvider>
    );
    const removeBtn = container.querySelector("[aria-label='Remove VIP Rank']");
    expect(removeBtn).toBeTruthy();
  });

  it("renders fp(final_price_value) — formatted price", () => {
    const item: CartItem = { ...baseItem, final_price_value: 1299 };
    const { container } = render(
      <TestProvider>
        <CartItemRow item={item} layout="drawer" />
      </TestProvider>
    );
    // formatPrice(1299) → "12,99 zł" or similar — just confirm numeric part
    expect(container.textContent).toContain("12");
  });

  it("renders strikethrough regular price only when it differs from final price", () => {
    const itemWithDiscount: CartItem = {
      ...baseItem,
      regular_price_value: 2000,
      final_price_value: 1000,
    };
    const { container } = render(
      <TestProvider>
        <CartItemRow item={itemWithDiscount} layout="drawer" />
      </TestProvider>
    );
    expect(container.querySelector(".cart-item-price-old")).toBeTruthy();
  });

  it("does not show strikethrough price when regular equals final", () => {
    const { container } = render(
      <TestProvider>
        <CartItemRow item={baseItem} layout="drawer" />
      </TestProvider>
    );
    expect(container.querySelector(".cart-item-price-old")).toBeFalsy();
  });
});

describe("CartItemRow — layout", () => {
  it('drawer layout renders li.cart-item', () => {
    const { container } = render(
      <TestProvider>
        <CartItemRow item={baseItem} layout="drawer" />
      </TestProvider>
    );
    expect(container.querySelector("li.cart-item")).toBeTruthy();
  });

  it('cart layout renders div.cp-item', () => {
    const { container } = render(
      <TestProvider>
        <CartItemRow item={baseItem} layout="cart" />
      </TestProvider>
    );
    expect(container.querySelector("div.cp-item")).toBeTruthy();
  });

  it('checkout layout renders div.checkout-item', () => {
    const { container } = render(
      <TestProvider>
        <CartItemRow item={baseItem} layout="checkout" />
      </TestProvider>
    );
    expect(container.querySelector("div.checkout-item")).toBeTruthy();
  });
});
