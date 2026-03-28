import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SpaceISClient } from "../client";

const BASE_URL = "https://api.example.com";
const SHOP_UUID = "test-shop";
const BASE = `${BASE_URL}/${SHOP_UUID}`;

function makeClient() {
  return new SpaceISClient({ baseUrl: BASE_URL, shopUuid: SHOP_UUID });
}

function mockFetch(responseData: unknown) {
  const fn = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(responseData), { status: 200 })
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

function fetchUrl(fetchMock: ReturnType<typeof vi.fn>): string {
  return fetchMock.mock.calls[0][0] as string;
}

function fetchInit(fetchMock: ReturnType<typeof vi.fn>): RequestInit {
  return fetchMock.mock.calls[0][1] as RequestInit;
}

function fetchBody(fetchMock: ReturnType<typeof vi.fn>): unknown {
  return JSON.parse(fetchInit(fetchMock).body as string);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API Modules", () => {
  // ---------------------------------------------------------------------------
  // ProductsModule
  // ---------------------------------------------------------------------------
  describe("ProductsModule", () => {
    it("list() calls GET /products", async () => {
      const data = { data: [], meta: {} };
      const fetchMock = mockFetch(data);
      const client = makeClient();

      const result = await client.products.list();

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/products`);
      expect(fetchInit(fetchMock).method).toBe("GET");
      expect(result).toEqual(data);
    });

    it("list() passes query params", async () => {
      const fetchMock = mockFetch({ data: [], meta: {} });
      const client = makeClient();

      await client.products.list({ page: 2, category_slug: "vip" });

      const url = fetchUrl(fetchMock);
      expect(url).toContain("page=2");
      expect(url).toContain("category_slug=vip");
    });

    it("get() calls GET /products/:slug and unwraps data", async () => {
      const product = { uuid: "p1", name: "VIP Rank" };
      const fetchMock = mockFetch({ data: product });
      const client = makeClient();

      const result = await client.products.get("vip-rank");

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/products/vip-rank`);
      expect(result).toEqual(product);
    });

    it("get() encodes slug with special characters", async () => {
      const fetchMock = mockFetch({ data: {} });
      const client = makeClient();

      await client.products.get("rank/special");

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/products/rank%2Fspecial`);
    });

    it("recommendations() calls GET /products/:slug/package-recommendations and unwraps data", async () => {
      const recs = [{ uuid: "pkg1", name: "Bundle" }];
      const fetchMock = mockFetch({ data: recs });
      const client = makeClient();

      const result = await client.products.recommendations("vip-rank");

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/products/vip-rank/package-recommendations`);
      expect(result).toEqual(recs);
    });
  });

  // ---------------------------------------------------------------------------
  // CategoriesModule
  // ---------------------------------------------------------------------------
  describe("CategoriesModule", () => {
    it("list() calls GET /categories and unwraps data", async () => {
      const categories = [{ uuid: "c1", name: "VIP" }];
      const fetchMock = mockFetch({ data: categories });
      const client = makeClient();

      const result = await client.categories.list();

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/categories`);
      expect(result).toEqual(categories);
    });

    it("list() passes query params", async () => {
      const fetchMock = mockFetch({ data: [] });
      const client = makeClient();

      await client.categories.list({ active: true });

      expect(fetchUrl(fetchMock)).toContain("active=true");
    });
  });

  // ---------------------------------------------------------------------------
  // CartModule
  // ---------------------------------------------------------------------------
  describe("CartModule", () => {
    it("get() calls GET /cart and unwraps data", async () => {
      const cart = { uuid: "cart1", items: [] };
      const fetchMock = mockFetch({ data: cart });
      const client = makeClient();

      const result = await client.cart.get();

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/cart`);
      expect(result).toEqual(cart);
    });

    it("addItem() calls POST /cart/cart-items/add-item with body", async () => {
      const response = { data: { items: [] } };
      const fetchMock = mockFetch(response);
      const client = makeClient();

      const body = { variant_uuid: "v1", quantity: 1000 };
      const result = await client.cart.addItem(body);

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/cart/cart-items/add-item`);
      expect(fetchInit(fetchMock).method).toBe("POST");
      expect(fetchBody(fetchMock)).toEqual(body);
      expect(result).toEqual(response);
    });

    it("removeItem() calls POST /cart/cart-items/remove-item with body", async () => {
      const fetchMock = mockFetch({});
      const client = makeClient();

      const body = { variant_uuid: "v1", quantity: 1000 };
      await client.cart.removeItem(body);

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/cart/cart-items/remove-item`);
      expect(fetchInit(fetchMock).method).toBe("POST");
      expect(fetchBody(fetchMock)).toEqual(body);
    });

    it("updateQuantity() calls PATCH /cart/cart-items/update-quantity with body", async () => {
      const fetchMock = mockFetch({});
      const client = makeClient();

      const body = { variant_uuid: "v1", quantity: 2000 };
      await client.cart.updateQuantity(body);

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/cart/cart-items/update-quantity`);
      expect(fetchInit(fetchMock).method).toBe("PATCH");
      expect(fetchBody(fetchMock)).toEqual(body);
    });

    it("applyDiscount() calls POST /cart/cart-discounts with code in body", async () => {
      const fetchMock = mockFetch({});
      const client = makeClient();

      await client.cart.applyDiscount("SUMMER20");

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/cart/cart-discounts`);
      expect(fetchInit(fetchMock).method).toBe("POST");
      expect(fetchBody(fetchMock)).toEqual({ code: "SUMMER20" });
    });

    it("removeDiscount() calls DELETE /cart/cart-discounts", async () => {
      const fetchMock = mockFetch({});
      const client = makeClient();

      await client.cart.removeDiscount();

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/cart/cart-discounts`);
      expect(fetchInit(fetchMock).method).toBe("DELETE");
    });

    it("recommendations() calls GET /cart/packages/recommendations and unwraps data", async () => {
      const recs = [{ uuid: "pkg1" }];
      const fetchMock = mockFetch({ data: recs });
      const client = makeClient();

      const result = await client.cart.recommendations();

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/cart/packages/recommendations`);
      expect(result).toEqual(recs);
    });
  });

  // ---------------------------------------------------------------------------
  // CheckoutModule
  // ---------------------------------------------------------------------------
  describe("CheckoutModule", () => {
    it("placeOrder() calls POST /cart/checkout with body", async () => {
      const response = { redirect_url: "https://pay.example.com/123" };
      const fetchMock = mockFetch(response);
      const client = makeClient();

      const body = {
        username: "Steve",
        email: "steve@example.com",
        payment_method_uuid: "pm-1",
        agreements: ["agr-1"],
      };
      const result = await client.checkout.placeOrder(body);

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/cart/checkout`);
      expect(fetchInit(fetchMock).method).toBe("POST");
      expect(fetchBody(fetchMock)).toEqual(body);
      expect(result).toEqual(response);
    });

    it("paymentMethods() calls GET /payment-methods with active=true and unwraps data", async () => {
      const methods = [{ uuid: "pm-1", name: "PayPal" }];
      const fetchMock = mockFetch({ data: methods });
      const client = makeClient();

      const result = await client.checkout.paymentMethods();

      const url = fetchUrl(fetchMock);
      expect(url).toContain(`${BASE}/payment-methods`);
      expect(url).toContain("active=true");
      expect(result).toEqual(methods);
    });

    it("agreements() calls GET /agreements and unwraps data", async () => {
      const agreements = [{ uuid: "agr-1", name: "Terms" }];
      const fetchMock = mockFetch({ data: agreements });
      const client = makeClient();

      const result = await client.checkout.agreements();

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/agreements`);
      expect(result).toEqual(agreements);
    });
  });

  // ---------------------------------------------------------------------------
  // OrdersModule
  // ---------------------------------------------------------------------------
  describe("OrdersModule", () => {
    it("summary() calls GET /cart/summary/:orderCode and unwraps data", async () => {
      const order = { code: "ORD-123", status: "completed", items: [{ name: "VIP" }] };
      const fetchMock = mockFetch({ data: order });
      const client = makeClient();

      const result = await client.orders.summary("ORD-123");

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/cart/summary/ORD-123`);
      expect(result).toEqual(order);
    });

    it("summary() normalizes single-object items to array", async () => {
      const order = { code: "ORD-456", status: "pending", items: { name: "Single Item" } };
      const fetchMock = mockFetch({ data: order });
      const client = makeClient();

      const result = await client.orders.summary("ORD-456");

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/cart/summary/ORD-456`);
      expect(result.items).toEqual([{ name: "Single Item" }]);
    });

    it("summary() encodes order code with special characters", async () => {
      const fetchMock = mockFetch({ data: { code: "ORD/1", items: [] } });
      const client = makeClient();

      await client.orders.summary("ORD/1");

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/cart/summary/ORD%2F1`);
    });
  });

  // ---------------------------------------------------------------------------
  // ContentModule
  // ---------------------------------------------------------------------------
  describe("ContentModule", () => {
    it("pages() calls GET /pages and unwraps data", async () => {
      const pages = [{ slug: "about", title: "About Us" }];
      const fetchMock = mockFetch({ data: pages });
      const client = makeClient();

      const result = await client.content.pages();

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/pages`);
      expect(result).toEqual(pages);
    });

    it("pages() passes query params", async () => {
      const fetchMock = mockFetch({ data: [] });
      const client = makeClient();

      await client.content.pages({ visible_in_menu: true });

      expect(fetchUrl(fetchMock)).toContain("visible_in_menu=true");
    });

    it("page() calls GET /pages/:slug and unwraps data", async () => {
      const page = { slug: "about-us", title: "About Us", content: "<p>Hi</p>" };
      const fetchMock = mockFetch({ data: page });
      const client = makeClient();

      const result = await client.content.page("about-us");

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/pages/about-us`);
      expect(result).toEqual(page);
    });

    it("statute() calls GET /statute and unwraps data", async () => {
      const statute = { content: "<p>Terms of Service</p>" };
      const fetchMock = mockFetch({ data: statute });
      const client = makeClient();

      const result = await client.content.statute();

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/statute`);
      expect(result).toEqual(statute);
    });
  });

  // ---------------------------------------------------------------------------
  // SalesModule
  // ---------------------------------------------------------------------------
  describe("SalesModule", () => {
    it("list() calls GET /sales", async () => {
      const response = { data: [], meta: {} };
      const fetchMock = mockFetch(response);
      const client = makeClient();

      const result = await client.sales.list();

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/sales`);
      expect(result).toEqual(response);
    });

    it("list() passes query params", async () => {
      const fetchMock = mockFetch({ data: [], meta: {} });
      const client = makeClient();

      await client.sales.list({ sort: "expires_at", page: 1 });

      const url = fetchUrl(fetchMock);
      expect(url).toContain("sort=expires_at");
      expect(url).toContain("page=1");
    });
  });

  // ---------------------------------------------------------------------------
  // GoalsModule
  // ---------------------------------------------------------------------------
  describe("GoalsModule", () => {
    it("list() calls GET /goals", async () => {
      const response = { data: [], meta: {} };
      const fetchMock = mockFetch(response);
      const client = makeClient();

      const result = await client.goals.list();

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/goals`);
      expect(result).toEqual(response);
    });

    it("list() passes query params", async () => {
      const fetchMock = mockFetch({ data: [], meta: {} });
      const client = makeClient();

      await client.goals.list({ page: 3 });

      expect(fetchUrl(fetchMock)).toContain("page=3");
    });
  });

  // ---------------------------------------------------------------------------
  // PackagesModule
  // ---------------------------------------------------------------------------
  describe("PackagesModule", () => {
    it("list() calls GET /packages", async () => {
      const response = { data: [], meta: {} };
      const fetchMock = mockFetch(response);
      const client = makeClient();

      const result = await client.packages.list();

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/packages`);
      expect(result).toEqual(response);
    });

    it("list() passes query params", async () => {
      const fetchMock = mockFetch({ data: [], meta: {} });
      const client = makeClient();

      await client.packages.list({ page: 2, category_slug: "bundles" });

      const url = fetchUrl(fetchMock);
      expect(url).toContain("page=2");
      expect(url).toContain("category_slug=bundles");
    });
  });

  // ---------------------------------------------------------------------------
  // VouchersModule
  // ---------------------------------------------------------------------------
  describe("VouchersModule", () => {
    it("redeem() calls POST /vouchers/use with body", async () => {
      const response = { message: "Voucher redeemed successfully" };
      const fetchMock = mockFetch(response);
      const client = makeClient();

      const body = { username: "Steve", code: "FREE-VIP-2024" };
      const result = await client.vouchers.redeem(body);

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/vouchers/use`);
      expect(fetchInit(fetchMock).method).toBe("POST");
      expect(fetchBody(fetchMock)).toEqual(body);
      expect(result).toEqual(response);
    });
  });

  // ---------------------------------------------------------------------------
  // DailyRewardsModule
  // ---------------------------------------------------------------------------
  describe("DailyRewardsModule", () => {
    it("claim() calls POST /daily-rewards/use with body", async () => {
      const response = { message: "Daily reward claimed!" };
      const fetchMock = mockFetch(response);
      const client = makeClient();

      const body = { username: "Steve" };
      const result = await client.dailyRewards.claim(body);

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/daily-rewards/use`);
      expect(fetchInit(fetchMock).method).toBe("POST");
      expect(fetchBody(fetchMock)).toEqual(body);
      expect(result).toEqual(response);
    });
  });

  // ---------------------------------------------------------------------------
  // RankingsModule
  // ---------------------------------------------------------------------------
  describe("RankingsModule", () => {
    it("top() calls GET /customer-rankings/top and unwraps data", async () => {
      const customers = [{ username: "Steve", total: 5000 }];
      const fetchMock = mockFetch({ data: customers });
      const client = makeClient();

      const result = await client.rankings.top();

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/customer-rankings/top`);
      expect(result).toEqual(customers);
    });

    it("top() passes query params", async () => {
      const fetchMock = mockFetch({ data: [] });
      const client = makeClient();

      await client.rankings.top({ limit: 10 });

      expect(fetchUrl(fetchMock)).toContain("limit=10");
    });

    it("latest() calls GET /customer-rankings/latest and unwraps data", async () => {
      const orders = [{ username: "Alex", product: "VIP" }];
      const fetchMock = mockFetch({ data: orders });
      const client = makeClient();

      const result = await client.rankings.latest();

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/customer-rankings/latest`);
      expect(result).toEqual(orders);
    });

    it("latest() passes query params", async () => {
      const fetchMock = mockFetch({ data: [] });
      const client = makeClient();

      await client.rankings.latest({ limit: 5 });

      expect(fetchUrl(fetchMock)).toContain("limit=5");
    });
  });

  // ---------------------------------------------------------------------------
  // ShopModule
  // ---------------------------------------------------------------------------
  describe("ShopModule", () => {
    it("config() calls GET /template and unwraps data", async () => {
      const config = { app_name: "My Shop", meta: { accent_color: "#7c3aed" } };
      const fetchMock = mockFetch({ data: config });
      const client = makeClient();

      const result = await client.shop.config();

      expect(fetchUrl(fetchMock)).toBe(`${BASE}/template`);
      expect(result).toEqual(config);
    });
  });

  // ---------------------------------------------------------------------------
  // RecaptchaModule — skipped (requires DOM/script loading)
  // ---------------------------------------------------------------------------
  describe("RecaptchaModule", () => {
    it.skip("skipped — requires DOM and script loading, not unit-testable easily", () => {});
  });
});
