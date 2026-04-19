import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHttpClient, type HttpConfig } from "../http";
import { SpaceISError } from "../error";

function makeConfig(overrides: Partial<HttpConfig> = {}): HttpConfig {
  return {
    baseUrl: "https://api.example.com",
    shopUuid: "shop-uuid-123",
    timeout: 5000,
    ...overrides,
  };
}

function makeFetchResponse(
  body: unknown,
  status = 200,
  statusText = "OK"
): Response {
  const json = JSON.stringify(body);
  return new Response(json, {
    status,
    statusText,
    headers: { "Content-Type": "application/json" },
  });
}

function make204Response(): Response {
  return new Response(null, { status: 204, statusText: "No Content" });
}

function makeErrorResponse(
  body: unknown,
  status: number,
  statusText = "Error"
): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("createHttpClient", () => {
  describe("URL building", () => {
    it("constructs the correct URL from baseUrl, shopUuid and path", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse({ ok: true }));
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());
      await request("products");

      const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(calledUrl).toBe("https://api.example.com/shop-uuid-123/products");
    });

    it("appends lang query parameter when lang is set", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse({}));
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig({ lang: "pl" }));
      await request("products");

      const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(calledUrl).toContain("lang=pl");
    });

    it("does not append lang when it is not set", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse({}));
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());
      await request("products");

      const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(calledUrl).not.toContain("lang=");
    });

    it("appends extra query params from options.params", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse([]));
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());
      await request("products", { params: { page: 2, category: "vip" } });

      const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(calledUrl).toContain("page=2");
      expect(calledUrl).toContain("category=vip");
    });

    it("skips null and empty-string params", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse([]));
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());
      await request("products", { params: { page: null, category: "" } });

      const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(calledUrl).not.toContain("page=");
      expect(calledUrl).not.toContain("category=");
    });

    describe("extraParams", () => {
      it("flattens extraParams keys into the query string", async () => {
        const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse([]));
        vi.stubGlobal("fetch", fetchMock);

        const request = createHttpClient(() => makeConfig());
        await request("products", {
          params: { page: 1, extraParams: { foo: "1", bar: "baz" } },
        });

        const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(calledUrl).toContain("page=1");
        expect(calledUrl).toContain("foo=1");
        expect(calledUrl).toContain("bar=baz");
        // Literal "extraParams" should NEVER appear as a query key
        expect(calledUrl).not.toContain("extraParams=");
      });

      it("top-level params override extraParams on key collision", async () => {
        const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse([]));
        vi.stubGlobal("fetch", fetchMock);

        const request = createHttpClient(() => makeConfig());
        await request("products", {
          params: { category: "vip", extraParams: { category: "free" } },
        });

        const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
        const url = new URL(calledUrl);
        expect(url.searchParams.get("category")).toBe("vip");
        expect(url.searchParams.getAll("category")).toEqual(["vip"]);
      });

      it("skips null and empty values inside extraParams", async () => {
        const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse([]));
        vi.stubGlobal("fetch", fetchMock);

        const request = createHttpClient(() => makeConfig());
        await request("products", {
          params: {
            extraParams: { keep: "1", drop_null: null, drop_empty: "", drop_undef: undefined },
          },
        });

        const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(calledUrl).toContain("keep=1");
        expect(calledUrl).not.toContain("drop_null=");
        expect(calledUrl).not.toContain("drop_empty=");
        expect(calledUrl).not.toContain("drop_undef=");
      });

      it("omits extraParams cleanly when absent (no regression on existing callers)", async () => {
        const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse([]));
        vi.stubGlobal("fetch", fetchMock);

        const request = createHttpClient(() => makeConfig());
        await request("products", { params: { page: 2, category: "vip" } });

        const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(calledUrl).toContain("page=2");
        expect(calledUrl).toContain("category=vip");
      });

      it("ignores a non-object extraParams value (defensive)", async () => {
        const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse([]));
        vi.stubGlobal("fetch", fetchMock);

        const request = createHttpClient(() => makeConfig());
        // A consumer ignoring TS types could pass a string — must not crash or leak
        await request("products", {
          params: { extraParams: "bogus" as unknown as Record<string, unknown> },
        });

        const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(calledUrl).not.toContain("extraParams=");
      });
    });
  });

  describe("headers", () => {
    it("always sends Accept: application/json", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse({}));
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());
      await request("products");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers["Accept"]).toBe("application/json");
    });

    it("sends X-Cart-Token when cartToken is present", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse({}));
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() =>
        makeConfig({ cartToken: "my-cart-token" })
      );
      await request("cart");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers["X-Cart-Token"]).toBe("my-cart-token");
    });

    it("does not send X-Cart-Token when cartToken is absent", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse({}));
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());
      await request("cart");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers["X-Cart-Token"]).toBeUndefined();
    });

    it("sends Content-Type: application/json when body is provided", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse({}));
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());
      await request("cart/add", { method: "POST", body: { variant_uuid: "abc" } });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("does not send Content-Type when there is no body", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse({}));
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());
      await request("products");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBeUndefined();
    });

    it("merges extra headers from options.headers", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse({}));
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());
      await request("products", { headers: { "X-Custom": "value" } });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers["X-Custom"]).toBe("value");
    });
  });

  describe("request body", () => {
    it("serialises body to JSON", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse({}));
      vi.stubGlobal("fetch", fetchMock);

      const payload = { variant_uuid: "uuid-abc", quantity: 1000 };
      const request = createHttpClient(() => makeConfig());
      await request("cart/add", { method: "POST", body: payload });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.body).toBe(JSON.stringify(payload));
    });

    it("uses GET as the default method", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse({}));
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());
      await request("products");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe("GET");
    });
  });

  describe("successful responses", () => {
    it("returns parsed JSON body", async () => {
      const data = { id: 1, name: "VIP Rank" };
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse(data));
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());
      const result = await request("products/vip");

      expect(result).toEqual(data);
    });

    it("returns undefined for 204 No Content", async () => {
      const fetchMock = vi.fn().mockResolvedValue(make204Response());
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());
      const result = await request("cart/item");

      expect(result).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("throws SpaceISError on non-ok response", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        makeErrorResponse({ message: "Not found" }, 404, "Not Found")
      );
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());

      await expect(request("products/missing")).rejects.toBeInstanceOf(SpaceISError);
    });

    it("uses JSON message from error body", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        makeErrorResponse({ message: "The given data was invalid." }, 422)
      );
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());

      await expect(request("cart/add", { method: "POST", body: {} })).rejects.toMatchObject({
        message: "The given data was invalid.",
        status: 422,
      });
    });

    it("extracts field errors from 422 response", async () => {
      const errors = { email: ["Required"], name: ["Too short"] };
      const fetchMock = vi.fn().mockResolvedValue(
        makeErrorResponse({ message: "Validation error", errors }, 422)
      );
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());

      let caught: SpaceISError | undefined;
      try {
        await request("checkout", { method: "POST", body: {} });
      } catch (e) {
        caught = e as SpaceISError;
      }

      expect(caught).toBeInstanceOf(SpaceISError);
      expect(caught?.errors).toEqual(errors);
      expect(caught?.isValidation).toBe(true);
    });

    it("falls back to status text when response body is not JSON", async () => {
      const response = new Response("Internal Server Error", {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "Content-Type": "text/plain" },
      });
      const fetchMock = vi.fn().mockResolvedValue(response);
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());

      let caught: SpaceISError | undefined;
      try {
        await request("products");
      } catch (e) {
        caught = e as SpaceISError;
      }

      expect(caught).toBeInstanceOf(SpaceISError);
      expect(caught?.status).toBe(500);
      expect(caught?.message).toContain("500");
    });

    it("sets isNotFound to true for 404 errors", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        makeErrorResponse({ message: "Not found" }, 404)
      );
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());

      let caught: SpaceISError | undefined;
      try {
        await request("products/missing");
      } catch (e) {
        caught = e as SpaceISError;
      }

      expect(caught?.isNotFound).toBe(true);
    });

    it("sets isRateLimited to true for 429 errors", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        makeErrorResponse({ message: "Too many requests" }, 429)
      );
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => makeConfig());

      let caught: SpaceISError | undefined;
      try {
        await request("products");
      } catch (e) {
        caught = e as SpaceISError;
      }

      expect(caught?.isRateLimited).toBe(true);
    });

    it("calls onError hook when provided", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        makeErrorResponse({ message: "Server error" }, 500)
      );
      vi.stubGlobal("fetch", fetchMock);

      const onError = vi.fn();
      const request = createHttpClient(() => makeConfig({ onError }));

      await expect(request("products")).rejects.toBeInstanceOf(SpaceISError);
      expect(onError).toHaveBeenCalledOnce();
      expect(onError.mock.calls[0][0]).toBeInstanceOf(SpaceISError);
    });
  });

  describe("lifecycle hooks", () => {
    it("calls onRequest before the fetch", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse({}));
      vi.stubGlobal("fetch", fetchMock);

      const onRequest = vi.fn();
      const request = createHttpClient(() => makeConfig({ onRequest }));
      await request("products");

      expect(onRequest).toHaveBeenCalledOnce();
      const [url, init] = onRequest.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("products");
      expect(init).toBeDefined();
    });

    it("calls onResponse after a successful fetch", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse({ ok: true }));
      vi.stubGlobal("fetch", fetchMock);

      const onResponse = vi.fn();
      const request = createHttpClient(() => makeConfig({ onResponse }));
      await request("products");

      expect(onResponse).toHaveBeenCalledOnce();
    });
  });

  describe("config reactivity", () => {
    it("picks up a new cartToken when config is updated between requests", async () => {
      let config = makeConfig();
      // Return a fresh Response object for each call to avoid "Body already read"
      const fetchMock = vi
        .fn()
        .mockImplementation(() => Promise.resolve(makeFetchResponse({})));
      vi.stubGlobal("fetch", fetchMock);

      const request = createHttpClient(() => config);

      // First request — no token
      await request("cart");
      let headers = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
        .headers as Record<string, string>;
      expect(headers["X-Cart-Token"]).toBeUndefined();

      // Update config with a token
      config = { ...config, cartToken: "new-token" };

      // Second request — token should be present
      await request("cart");
      headers = (fetchMock.mock.calls[1] as [string, RequestInit])[1]
        .headers as Record<string, string>;
      expect(headers["X-Cart-Token"]).toBe("new-token");
    });
  });
});
