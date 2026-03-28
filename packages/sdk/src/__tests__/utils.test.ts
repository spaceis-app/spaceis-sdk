import { describe, it, expect } from "vitest";
import {
  fromApiQty,
  toApiQty,
  formatPrice,
  centsToAmount,
  getCartItemImage,
  getItemQty,
  getProductLimits,
  escapeHtml,
  snapQuantity,
} from "../utils";

describe("fromApiQty", () => {
  it("converts 1000 to 1", () => {
    expect(fromApiQty(1000)).toBe(1);
  });

  it("converts 2000 to 2", () => {
    expect(fromApiQty(2000)).toBe(2);
  });

  it("converts 2500 to 2.5", () => {
    expect(fromApiQty(2500)).toBe(2.5);
  });

  it("converts 500 to 0.5", () => {
    expect(fromApiQty(500)).toBe(0.5);
  });

  it("converts 0 to 0", () => {
    expect(fromApiQty(0)).toBe(0);
  });
});

describe("toApiQty", () => {
  it("converts 1 to 1000", () => {
    expect(toApiQty(1)).toBe(1000);
  });

  it("converts 2 to 2000", () => {
    expect(toApiQty(2)).toBe(2000);
  });

  it("converts 2.5 to 2500", () => {
    expect(toApiQty(2.5)).toBe(2500);
  });

  it("converts 0 to 0", () => {
    expect(toApiQty(0)).toBe(0);
  });

  it("is the inverse of fromApiQty", () => {
    expect(toApiQty(fromApiQty(3000))).toBe(3000);
    expect(fromApiQty(toApiQty(5))).toBe(5);
  });
});

describe("formatPrice", () => {
  it("formats cents to PLN by default", () => {
    const result = formatPrice(1299);
    // The formatted string should contain "12" and "99" and a currency symbol
    expect(result).toMatch(/12/);
    expect(result).toMatch(/99/);
  });

  it("formats 0 cents", () => {
    const result = formatPrice(0);
    expect(result).toMatch(/0/);
  });

  it("accepts a custom currency", () => {
    const result = formatPrice(1000, "EUR", "de");
    expect(result).toMatch(/10/);
    expect(result).toMatch(/€/);
  });

  it("accepts a custom locale", () => {
    // Just verify it does not throw and returns a string
    const result = formatPrice(5000, "USD", "en");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("formats 100 cents as 1 unit", () => {
    const result = formatPrice(100, "PLN", "pl");
    expect(result).toMatch(/1/);
  });
});

describe("centsToAmount", () => {
  it("converts 1299 cents to 12.99", () => {
    expect(centsToAmount(1299)).toBe(12.99);
  });

  it("converts 100 cents to 1", () => {
    expect(centsToAmount(100)).toBe(1);
  });

  it("converts 50 cents to 0.5", () => {
    expect(centsToAmount(50)).toBe(0.5);
  });

  it("converts 0 to 0", () => {
    expect(centsToAmount(0)).toBe(0);
  });
});

describe("getCartItemImage", () => {
  it("returns variant image when present", () => {
    const item = {
      variant: { image: "https://example.com/variant.jpg" },
      shop_product: { image: "https://example.com/product.jpg" },
    };
    expect(getCartItemImage(item)).toBe("https://example.com/variant.jpg");
  });

  it("falls back to shop_product image when variant image is null", () => {
    const item = {
      variant: { image: null },
      shop_product: { image: "https://example.com/product.jpg" },
    };
    expect(getCartItemImage(item)).toBe("https://example.com/product.jpg");
  });

  it("falls back to shop_product image when variant image is undefined", () => {
    const item = {
      variant: {},
      shop_product: { image: "https://example.com/product.jpg" },
    };
    expect(getCartItemImage(item)).toBe("https://example.com/product.jpg");
  });

  it("returns null when both images are absent", () => {
    const item = {
      variant: { image: null },
      shop_product: { image: null },
    };
    expect(getCartItemImage(item)).toBeNull();
  });

  it("returns null when variant and shop_product are null", () => {
    const item = { variant: null, shop_product: null };
    expect(getCartItemImage(item)).toBeNull();
  });

  it("returns null when variant and shop_product are undefined", () => {
    const item = {};
    expect(getCartItemImage(item)).toBeNull();
  });
});

describe("getItemQty", () => {
  it("converts API quantity to human-readable quantity", () => {
    expect(getItemQty({ quantity: 2000 })).toBe(2);
  });

  it("handles fractional quantities", () => {
    expect(getItemQty({ quantity: 1500 })).toBe(1.5);
  });

  it("handles a single item (1000)", () => {
    expect(getItemQty({ quantity: 1000 })).toBe(1);
  });

  it("handles zero quantity", () => {
    expect(getItemQty({ quantity: 0 })).toBe(0);
  });
});

describe("getProductLimits", () => {
  it("returns human-readable limits from API values", () => {
    const product = {
      min_quantity: 1000,
      max_quantity: 64000,
      quantity_step: 1000,
    };

    const limits = getProductLimits(product);

    expect(limits.min).toBe(1);
    expect(limits.max).toBe(64);
    expect(limits.step).toBe(1);
  });

  it("uses defaults when fields are null", () => {
    const product = {
      min_quantity: null,
      max_quantity: null,
      quantity_step: null,
    };

    const limits = getProductLimits(product);

    expect(limits.min).toBe(1);      // 1000 / 1000
    expect(limits.max).toBe(99);     // 99000 / 1000
    expect(limits.step).toBe(1);     // 1000 / 1000
  });

  it("uses defaults when fields are undefined (empty object)", () => {
    const limits = getProductLimits({});

    expect(limits.min).toBe(1);
    expect(limits.max).toBe(99);
    expect(limits.step).toBe(1);
  });

  it("handles non-integer step values", () => {
    const product = {
      min_quantity: 500,
      max_quantity: 5000,
      quantity_step: 500,
    };

    const limits = getProductLimits(product);

    expect(limits.min).toBe(0.5);
    expect(limits.max).toBe(5);
    expect(limits.step).toBe(0.5);
  });
});

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes less-than", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
  });

  it("escapes greater-than", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's fine")).toBe("it&#39;s fine");
  });

  it("escapes a full XSS script tag", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  it("returns the string unchanged when there is nothing to escape", () => {
    expect(escapeHtml("Hello, world!")).toBe("Hello, world!");
  });

  it("handles an empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("escapes multiple different characters in one string", () => {
    expect(escapeHtml("a & b < c > d")).toBe("a &amp; b &lt; c &gt; d");
  });
});

describe("snapQuantity", () => {
  it("snaps to nearest step", () => {
    // min=1, step=2: valid values are 1,3,5,7,9
    expect(snapQuantity(3, { min: 1, max: 10, step: 2 })).toBe(3);
    expect(snapQuantity(4, { min: 1, max: 10, step: 2 })).toBe(5);
    expect(snapQuantity(2, { min: 1, max: 10, step: 2 })).toBe(3); // 0.5 rounds up
    // min=2, step=2: valid values are 2,4,6,8,10
    expect(snapQuantity(3, { min: 2, max: 10, step: 2 })).toBe(4);
    expect(snapQuantity(5, { min: 2, max: 10, step: 2 })).toBe(6);
  });

  it("clamps to min", () => {
    expect(snapQuantity(0, { min: 2, max: 10, step: 1 })).toBe(2);
  });

  it("clamps to max", () => {
    expect(snapQuantity(100, { min: 1, max: 10, step: 1 })).toBe(10);
  });

  it("returns min when qty equals min", () => {
    expect(snapQuantity(1, { min: 1, max: 10, step: 1 })).toBe(1);
  });

  it("returns max when qty equals max", () => {
    expect(snapQuantity(10, { min: 1, max: 10, step: 1 })).toBe(10);
  });

  it("handles step=1 (no snapping needed)", () => {
    expect(snapQuantity(5, { min: 1, max: 10, step: 1 })).toBe(5);
  });

  it("handles large step", () => {
    const result = snapQuantity(5, { min: 3, max: 100, step: 5 });
    expect(result === 3 || result === 8).toBe(true);
  });
});
