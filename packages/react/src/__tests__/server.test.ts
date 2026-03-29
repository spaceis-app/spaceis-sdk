import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  createServerClient,
  prefetchProducts,
  prefetchProduct,
  prefetchCategories,
  prefetchPackages,
  prefetchSales,
  prefetchGoals,
  prefetchShopConfig,
  prefetchPages,
  prefetchPage,
  prefetchStatute,
  prefetchTopCustomers,
  prefetchLatestOrders,
  prefetchPaymentMethods,
  prefetchAgreements,
} from "../server/index";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

/**
 * Mock an API response. The SDK HTTP layer calls `response.json()`,
 * and some modules unwrap `res.data` while others return the full response.
 * Pass the raw JSON that the API would return.
 */
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

describe("createServerClient", () => {
  it("creates a client with all modules", () => {
    const client = createServerClient({
      baseUrl: "https://api.example.com",
      shopUuid: "test-uuid",
    });

    expect(client.products).toBeDefined();
    expect(client.categories).toBeDefined();
    expect(client.cart).toBeDefined();
    expect(client.checkout).toBeDefined();
    expect(client.orders).toBeDefined();
    expect(client.sales).toBeDefined();
    expect(client.content).toBeDefined();
  });

  it("throws with missing config", () => {
    expect(() =>
      createServerClient({ baseUrl: "", shopUuid: "test" })
    ).toThrow();
  });
});

describe("prefetch helpers", () => {
  const client = createServerClient({
    baseUrl: "https://api.example.com",
    shopUuid: "test-uuid",
  });

  // products.list() returns the full paginated response as-is
  it("prefetchProducts populates query cache", async () => {
    const apiResponse = { data: [{ uuid: "1", name: "Sword" }], meta: { current_page: 1, last_page: 1 } };
    mockApiResponse(apiResponse);

    const qc = new QueryClient();
    await prefetchProducts(qc, client, { page: 1 });

    const cached = qc.getQueryData(["spaceis", "products", { page: 1 }]);
    expect(cached).toEqual(apiResponse);
  });

  // products.get() unwraps res.data
  it("prefetchProduct populates query cache", async () => {
    const product = { uuid: "1", name: "Test" };
    mockApiResponse({ data: product });

    const qc = new QueryClient();
    await prefetchProduct(qc, client, "test-slug");

    const cached = qc.getQueryData(["spaceis", "product", "test-slug"]);
    expect(cached).toEqual(product);
  });

  // categories.list() unwraps res.data
  it("prefetchCategories populates query cache", async () => {
    const categories = [{ uuid: "1", name: "VIP" }];
    mockApiResponse({ data: categories });

    const qc = new QueryClient();
    await prefetchCategories(qc, client);

    const cached = qc.getQueryData(["spaceis", "categories", undefined]);
    expect(cached).toEqual(categories);
  });

  // packages.list() returns full paginated response
  it("prefetchPackages populates query cache", async () => {
    const apiResponse = { data: [], meta: {} };
    mockApiResponse(apiResponse);

    const qc = new QueryClient();
    await prefetchPackages(qc, client);

    const cached = qc.getQueryData(["spaceis", "packages", undefined]);
    expect(cached).toEqual(apiResponse);
  });

  // sales.list() returns full paginated response
  it("prefetchSales populates query cache", async () => {
    const apiResponse = { data: [], meta: {} };
    mockApiResponse(apiResponse);

    const qc = new QueryClient();
    await prefetchSales(qc, client);

    const cached = qc.getQueryData(["spaceis", "sales", undefined]);
    expect(cached).toEqual(apiResponse);
  });

  // goals.list() returns full paginated response
  it("prefetchGoals populates query cache", async () => {
    const apiResponse = { data: [], meta: {} };
    mockApiResponse(apiResponse);

    const qc = new QueryClient();
    await prefetchGoals(qc, client);

    const cached = qc.getQueryData(["spaceis", "goals", undefined]);
    expect(cached).toEqual(apiResponse);
  });

  // shop.config() unwraps res.data
  it("prefetchShopConfig populates query cache", async () => {
    const config = { meta: { accent_color: "#000" } };
    mockApiResponse({ data: config });

    const qc = new QueryClient();
    await prefetchShopConfig(qc, client);

    const cached = qc.getQueryData(["spaceis", "shop-config"]);
    expect(cached).toEqual(config);
  });

  // content.pages() unwraps res.data
  it("prefetchPages populates query cache", async () => {
    const pages = [{ uuid: "1", title: "About" }];
    mockApiResponse({ data: pages });

    const qc = new QueryClient();
    await prefetchPages(qc, client);

    const cached = qc.getQueryData(["spaceis", "pages", undefined]);
    expect(cached).toEqual(pages);
  });

  // content.page() unwraps res.data
  it("prefetchPage populates query cache", async () => {
    const page = { uuid: "1", content: "<p>Hello</p>" };
    mockApiResponse({ data: page });

    const qc = new QueryClient();
    await prefetchPage(qc, client, "about");

    const cached = qc.getQueryData(["spaceis", "page", "about"]);
    expect(cached).toEqual(page);
  });

  // content.statute() unwraps res.data
  it("prefetchStatute populates query cache", async () => {
    const statute = { content: "<p>Terms</p>" };
    mockApiResponse({ data: statute });

    const qc = new QueryClient();
    await prefetchStatute(qc, client);

    const cached = qc.getQueryData(["spaceis", "statute"]);
    expect(cached).toEqual(statute);
  });

  // rankings.top() unwraps res.data
  it("prefetchTopCustomers populates query cache", async () => {
    const customers = [{ first_name: "Steve" }];
    mockApiResponse({ data: customers });

    const qc = new QueryClient();
    await prefetchTopCustomers(qc, client, { limit: 10 });

    const cached = qc.getQueryData(["spaceis", "rankings", "top", { limit: 10 }]);
    expect(cached).toEqual(customers);
  });

  // rankings.latest() unwraps res.data
  it("prefetchLatestOrders populates query cache", async () => {
    const orders = [{ first_name: "Alex" }];
    mockApiResponse({ data: orders });

    const qc = new QueryClient();
    await prefetchLatestOrders(qc, client, { limit: 5 });

    const cached = qc.getQueryData(["spaceis", "rankings", "latest", { limit: 5 }]);
    expect(cached).toEqual(orders);
  });

  // checkout.paymentMethods() unwraps res.data
  it("prefetchPaymentMethods populates query cache", async () => {
    const methods = [{ uuid: "1", name: "PayPal" }];
    mockApiResponse({ data: methods });

    const qc = new QueryClient();
    await prefetchPaymentMethods(qc, client);

    const cached = qc.getQueryData(["spaceis", "payment-methods"]);
    expect(cached).toEqual(methods);
  });

  // checkout.agreements() unwraps res.data
  it("prefetchAgreements populates query cache", async () => {
    const agreements = [{ uuid: "1", name: "Terms" }];
    mockApiResponse({ data: agreements });

    const qc = new QueryClient();
    await prefetchAgreements(qc, client);

    const cached = qc.getQueryData(["spaceis", "agreements"]);
    expect(cached).toEqual(agreements);
  });
});
