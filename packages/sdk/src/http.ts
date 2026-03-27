import { SpaceISError } from "./error";

/**
 * Internal HTTP configuration used by the fetch wrapper.
 * @internal
 */
export interface HttpConfig {
  /** API base URL (without trailing slash) */
  baseUrl: string;
  /** Shop UUID used as the URL path prefix */
  shopUuid: string;
  /** Language code appended as `?lang=` query parameter */
  lang?: string;
  /** Cart token sent as `X-Cart-Token` header */
  cartToken?: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Lifecycle hook: called before every request */
  onRequest?: (url: string, init: RequestInit) => void;
  /** Lifecycle hook: called after every response (even errors) */
  onResponse?: (response: Response) => void;
  /** Lifecycle hook: called when an API error is thrown */
  onError?: (error: SpaceISError) => void;
}

/**
 * Options for a single HTTP request.
 * @internal
 */
export interface RequestOptions {
  /** HTTP method (default: `"GET"`) */
  method?: string;
  /** Request body — automatically serialized to JSON */
  body?: unknown;
  /** Query parameters — appended to the URL */
  params?: Record<string, unknown>;
  /** Additional request headers */
  headers?: Record<string, string>;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
}

function buildUrl(
  prefix: string,
  path: string,
  params?: Record<string, unknown>,
  lang?: string
): string {
  const url = new URL(`${prefix}/${path}`);
  if (lang) url.searchParams.set("lang", lang);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/**
 * Creates a thin fetch wrapper bound to a mutable config reference.
 * Every call reads the latest config so setCartToken / setLang take effect immediately.
 */
export function createHttpClient(getConfig: () => HttpConfig) {
  return async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const config = getConfig();
    const { method = "GET", body, params, headers: extra, signal } = options;

    const url = buildUrl(`${config.baseUrl}/${config.shopUuid}`, path, params, config.lang);

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...extra,
    };
    if (body) headers["Content-Type"] = "application/json";
    if (config.cartToken) headers["X-Cart-Token"] = config.cartToken;

    const init: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: signal ?? AbortSignal.timeout(config.timeout),
    };

    config.onRequest?.(url, init);

    const response = await fetch(url, init);

    config.onResponse?.(response);

    if (!response.ok) {
      let message = `HTTP ${response.status}: ${response.statusText}`;
      let errors: Record<string, string[]> | undefined;

      try {
        const data: unknown = await response.json();
        if (data && typeof data === "object") {
          if ("message" in data && typeof (data as { message: unknown }).message === "string") {
            message = (data as { message: string }).message;
          }
          if ("errors" in data && typeof (data as { errors: unknown }).errors === "object") {
            errors = (data as { errors: Record<string, string[]> }).errors;
          }
        }
      } catch {
        // Response body is not JSON — keep status text
      }

      const error = new SpaceISError(message, response.status, errors);
      config.onError?.(error);
      throw error;
    }

    if (response.status === 204) return undefined as T;

    return response.json() as Promise<T>;
  };
}

export type RequestFn = ReturnType<typeof createHttpClient>;
