import { describe, it, expect, vi, beforeEach } from "vitest";
import { SpaceISClient } from "../client";
import type { HttpConfig } from "../http";
import { CartManager } from "../cart-manager";

function makeClient(overrides: Partial<ConstructorParameters<typeof SpaceISClient>[0]> = {}) {
  return new SpaceISClient({
    baseUrl: "https://api.example.com",
    shopUuid: "shop-uuid-abc",
    ...overrides,
  });
}

/** Access the private _config for test assertions */
function getConfig(client: SpaceISClient): HttpConfig {
  return (client as unknown as { _config: HttpConfig })._config;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("SpaceISClient constructor", () => {
  describe("validation", () => {
    it("throws when baseUrl is missing", () => {
      expect(
        () => new SpaceISClient({ baseUrl: "", shopUuid: "shop-uuid" })
      ).toThrowError("SpaceIS SDK: baseUrl and shopUuid are required");
    });

    it("throws when shopUuid is missing", () => {
      expect(
        () =>
          new SpaceISClient({ baseUrl: "https://api.example.com", shopUuid: "" })
      ).toThrowError("SpaceIS SDK: baseUrl and shopUuid are required");
    });

    it("throws when baseUrl does not start with http:// or https://", () => {
      expect(
        () =>
          new SpaceISClient({ baseUrl: "ftp://api.example.com", shopUuid: "uuid" })
      ).toThrowError("SpaceIS SDK: baseUrl must start with http:// or https://");
    });

    it("accepts http:// base URLs", () => {
      expect(
        () => new SpaceISClient({ baseUrl: "http://localhost:3000", shopUuid: "uuid" })
      ).not.toThrow();
    });

    it("accepts https:// base URLs", () => {
      expect(() => makeClient()).not.toThrow();
    });
  });

  describe("config initialisation", () => {
    it("stores shopUuid on the instance", () => {
      const client = makeClient({ shopUuid: "my-shop" });
      expect(client.shopUuid).toBe("my-shop");
    });

    it("strips trailing slash from baseUrl", () => {
      const client = makeClient({ baseUrl: "https://api.example.com/" });
      expect(getConfig(client).baseUrl).toBe("https://api.example.com");
    });

    it("sets default timeout to 30000 when not specified", () => {
      const client = makeClient();
      expect(getConfig(client).timeout).toBe(30_000);
    });

    it("uses the provided timeout", () => {
      const client = makeClient({ timeout: 5000 });
      expect(getConfig(client).timeout).toBe(5000);
    });

    it("stores lang in config", () => {
      const client = makeClient({ lang: "en" });
      expect(getConfig(client).lang).toBe("en");
    });

    it("stores initial cartToken in config", () => {
      const client = makeClient({ cartToken: "my-token" });
      expect(getConfig(client).cartToken).toBe("my-token");
    });

    it("stores onRequest, onResponse, onError callbacks", () => {
      const onRequest = vi.fn();
      const onResponse = vi.fn();
      const onError = vi.fn();

      const client = makeClient({ onRequest, onResponse, onError });

      expect(getConfig(client).onRequest).toBe(onRequest);
      expect(getConfig(client).onResponse).toBe(onResponse);
      expect(getConfig(client).onError).toBe(onError);
    });
  });

  describe("module initialisation", () => {
    it("exposes all API modules", () => {
      const client = makeClient();

      expect(client.products).toBeDefined();
      expect(client.categories).toBeDefined();
      expect(client.cart).toBeDefined();
      expect(client.checkout).toBeDefined();
      expect(client.orders).toBeDefined();
      expect(client.content).toBeDefined();
      expect(client.sales).toBeDefined();
      expect(client.goals).toBeDefined();
      expect(client.packages).toBeDefined();
      expect(client.vouchers).toBeDefined();
      expect(client.dailyRewards).toBeDefined();
      expect(client.rankings).toBeDefined();
      expect(client.shop).toBeDefined();
      expect(client.recaptcha).toBeDefined();
    });
  });
});

describe("SpaceISClient.cartToken getter", () => {
  it("returns undefined when no token is set", () => {
    const client = makeClient();
    expect(client.cartToken).toBeUndefined();
  });

  it("returns the token when one is set in options", () => {
    const client = makeClient({ cartToken: "initial-token" });
    expect(client.cartToken).toBe("initial-token");
  });
});

describe("SpaceISClient.setCartToken", () => {
  it("updates the cart token in config", () => {
    const client = makeClient();
    client.setCartToken("new-token");
    expect(getConfig(client).cartToken).toBe("new-token");
    expect(client.cartToken).toBe("new-token");
  });

  it("clears the cart token when called with undefined", () => {
    const client = makeClient({ cartToken: "existing-token" });
    client.setCartToken(undefined);
    expect(client.cartToken).toBeUndefined();
  });

  it("token change is reflected immediately in subsequent requests", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = makeClient();
    client.setCartToken("live-token");

    // Trigger a real request (products.list is a thin module call)
    await client.products.list({}).catch(() => {});

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Cart-Token"]).toBe("live-token");
  });
});

describe("SpaceISClient.setLang", () => {
  it("updates the lang in config", () => {
    const client = makeClient({ lang: "pl" });
    client.setLang("en");
    expect(getConfig(client).lang).toBe("en");
  });

  it("lang change is reflected in the request URL", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = makeClient();
    client.setLang("de");

    await client.products.list({}).catch(() => {});

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("lang=de");
  });
});

describe("SpaceISClient.createCartManager", () => {
  it("returns a CartManager instance", () => {
    const client = makeClient();
    const manager = client.createCartManager();
    expect(manager).toBeInstanceOf(CartManager);
  });

  it("passes options to CartManager", () => {
    const client = makeClient();
    const manager = client.createCartManager({ storagePrefix: "test_cart_" });
    // CartManager itself uses the prefix — just verify it was created without throwing
    expect(manager).toBeInstanceOf(CartManager);
  });

  it("each call returns a new independent CartManager", () => {
    const client = makeClient();
    const m1 = client.createCartManager();
    const m2 = client.createCartManager();
    expect(m1).not.toBe(m2);
  });
});
