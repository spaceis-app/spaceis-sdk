import type { RequestFn } from "../http";
import type { RecaptchaConfig } from "../types";

const LOAD_TIMEOUT_MS = 15_000;

/**
 * reCAPTCHA v3 integration module.
 *
 * Handles fetching the site key from the API, loading the reCAPTCHA script,
 * and executing challenges. The script is loaded lazily on first use
 * and cached for subsequent calls.
 *
 * @example
 * ```ts
 * // Manual usage
 * await client.recaptcha.load();
 * const token = await client.recaptcha.execute('checkout');
 *
 * // Or let execute() handle loading automatically
 * const token = await client.recaptcha.execute('voucher');
 * ```
 */
export class RecaptchaModule {
  private _config: RecaptchaConfig | null = null;
  private _configPromise: Promise<RecaptchaConfig> | null = null;
  private _scriptPromise: Promise<void> | null = null;

  constructor(private request: RequestFn) {}

  /** Get reCAPTCHA config (site key) from API. Cached after first call. */
  async getConfig(): Promise<RecaptchaConfig> {
    if (this._config) return this._config;
    if (this._configPromise) return this._configPromise;

    this._configPromise = this.request<RecaptchaConfig>("recaptcha/config").then((config) => {
      this._config = config;
      return config;
    }).catch((err) => {
      this._configPromise = null; // Allow retry on failure
      throw err;
    });

    return this._configPromise;
  }

  /** Get site key (fetches config if needed) */
  async getSiteKey(): Promise<string> {
    const config = await this.getConfig();
    return config.key;
  }

  /**
   * Load reCAPTCHA v3 script into the page.
   * Deduplicates: multiple calls return the same Promise.
   * Times out after 15 seconds if script fails to load.
   */
  async load(): Promise<void> {
    // Already available globally
    if (typeof grecaptcha !== "undefined" && typeof grecaptcha.execute === "function") {
      return;
    }
    // Dedup — return existing load promise
    if (this._scriptPromise) return this._scriptPromise;

    this._scriptPromise = this._loadScript();
    return this._scriptPromise;
  }

  private async _loadScript(): Promise<void> {
    const siteKey = await this.getSiteKey();

    // Already loaded while we were fetching config
    if (typeof grecaptcha !== "undefined" && typeof grecaptcha.execute === "function") {
      return;
    }

    // Script tag already in DOM (e.g. added by user) — wait for it with timeout
    if (document.querySelector('script[src*="recaptcha"]')) {
      return this._waitForGrecaptcha();
    }

    // Inject script
    return new Promise<void>((resolve, reject) => {
      const callbackName = "__spaceis_recaptcha_cb";

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("reCAPTCHA script load timed out"));
      }, LOAD_TIMEOUT_MS);

      const cleanup = () => {
        clearTimeout(timer);
        delete (globalThis as unknown as Record<string, unknown>)[callbackName];
      };

      (globalThis as unknown as Record<string, unknown>)[callbackName] = () => {
        cleanup();
        resolve();
      };

      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}&onload=${encodeURIComponent(callbackName)}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        cleanup();
        this._scriptPromise = null; // Allow retry
        reject(new Error("Failed to load reCAPTCHA script"));
      };
      document.head.appendChild(script);
    });
  }

  /** Wait for grecaptcha global to appear, with timeout */
  private _waitForGrecaptcha(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        clearInterval(check);
        this._scriptPromise = null;
        reject(new Error("reCAPTCHA script load timed out"));
      }, LOAD_TIMEOUT_MS);

      const check = setInterval(() => {
        if (typeof grecaptcha !== "undefined" && typeof grecaptcha.execute === "function") {
          clearInterval(check);
          clearTimeout(timer);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Execute reCAPTCHA v3 and return a token.
   * Loads the script automatically if needed.
   *
   * @param action - reCAPTCHA action name (e.g. "checkout", "voucher")
   * @returns reCAPTCHA token string
   */
  async execute(action = "submit"): Promise<string> {
    await this.load();
    const siteKey = await this.getSiteKey();
    return new Promise<string>((resolve, reject) => {
      grecaptcha.ready(() => {
        grecaptcha.execute(siteKey, { action }).then(resolve).catch(reject);
      });
    });
  }

  /** Whether config has been loaded */
  get isLoaded(): boolean {
    return this._config !== null;
  }

  /** Cached site key (null if not loaded yet) */
  get siteKey(): string | null {
    return this._config?.key ?? null;
  }
}

// Type declaration for grecaptcha global
declare const grecaptcha: {
  ready: (cb: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
};
