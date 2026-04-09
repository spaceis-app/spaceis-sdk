import { createHttpClient, type HttpConfig } from "./http";
import { ProductsModule } from "./modules/products";
import { CategoriesModule } from "./modules/categories";
import { CartModule } from "./modules/cart";
import { CheckoutModule } from "./modules/checkout";
import { OrdersModule } from "./modules/orders";
import { ContentModule } from "./modules/content";
import { SalesModule } from "./modules/sales";
import { GoalsModule } from "./modules/goals";
import { PackagesModule } from "./modules/packages";
import { VouchersModule } from "./modules/vouchers";
import { DailyRewardsModule } from "./modules/daily-rewards";
import { RankingsModule } from "./modules/rankings";
import { ShopModule } from "./modules/shop";
import { RecaptchaModule } from "./modules/recaptcha";
import { CartManager, type CartManagerOptions } from "./cart-manager";
import type { SpaceISError } from "./error";

export interface SpaceISOptions {
  /** API base URL (e.g. "https://storefront-api.spaceis.app") */
  baseUrl: string;
  /** Shop UUID */
  shopUuid: string;
  /** Language code (e.g. "pl", "en") */
  lang?: string;
  /** Cart token (if restoring a previous session) */
  cartToken?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Called before every request */
  onRequest?: (url: string, init: RequestInit) => void;
  /** Called after every response */
  onResponse?: (response: Response) => void;
  /** Called on every API error */
  onError?: (error: SpaceISError) => void;
}

/**
 * SpaceIS API client.
 *
 * @example
 * ```js
 * // Create client
 * var client = SpaceIS.createSpaceIS({
 *   baseUrl: 'https://storefront-api.spaceis.app',
 *   shopUuid: 'your-shop-uuid',
 *   lang: 'pl'
 * });
 *
 * // Use API modules
 * var products = await client.products.list({ page: 1 });
 * var product  = await client.products.get('vip-rank');
 *
 * // Cart with reactive state
 * var cart = client.createCartManager();
 * cart.onChange(function(data) { console.log(data); });
 * await cart.add('variant-uuid');
 * ```
 */
export class SpaceISClient {
  readonly shopUuid: string;

  /** @internal */
  private _config: HttpConfig;

  // ── API Modules ──
  readonly products: ProductsModule;
  readonly categories: CategoriesModule;
  readonly cart: CartModule;
  readonly checkout: CheckoutModule;
  readonly orders: OrdersModule;
  readonly content: ContentModule;
  readonly sales: SalesModule;
  readonly goals: GoalsModule;
  readonly packages: PackagesModule;
  readonly vouchers: VouchersModule;
  readonly dailyRewards: DailyRewardsModule;
  readonly rankings: RankingsModule;
  readonly shop: ShopModule;
  readonly recaptcha: RecaptchaModule;

  constructor(options: SpaceISOptions) {
    if (!options.baseUrl || !options.shopUuid) {
      throw new Error("SpaceIS SDK: baseUrl and shopUuid are required");
    }
    if (!/^https?:\/\//.test(options.baseUrl)) {
      throw new Error("SpaceIS SDK: baseUrl must start with http:// or https://");
    }

    this.shopUuid = options.shopUuid;

    this._config = {
      baseUrl: options.baseUrl.replace(/\/$/, ""),
      shopUuid: options.shopUuid,
      lang: options.lang,
      cartToken: options.cartToken,
      timeout: options.timeout ?? 30_000,
      onRequest: options.onRequest,
      onResponse: options.onResponse,
      onError: options.onError,
    };

    const request = createHttpClient(() => this._config);

    this.products = new ProductsModule(request);
    this.categories = new CategoriesModule(request);
    this.cart = new CartModule(request);
    this.checkout = new CheckoutModule(request);
    this.orders = new OrdersModule(request);
    this.content = new ContentModule(request);
    this.sales = new SalesModule(request);
    this.goals = new GoalsModule(request);
    this.packages = new PackagesModule(request);
    this.vouchers = new VouchersModule(request);
    this.dailyRewards = new DailyRewardsModule(request);
    this.rankings = new RankingsModule(request);
    this.shop = new ShopModule(request);
    this.recaptcha = new RecaptchaModule(request);
  }

  // ── Config helpers ──

  /** Current cart token */
  get cartToken(): string | undefined {
    return this._config.cartToken;
  }

  /** Set or clear cart token */
  setCartToken(token: string | undefined) {
    this._config.cartToken = token;
  }

  /** Current language code */
  get lang(): string | undefined {
    return this._config.lang;
  }

  /** Set language for API requests */
  setLang(lang: string) {
    this._config.lang = lang;
  }

  // ── Factory ──

  /**
   * Create a reactive cart manager with auto-persistence.
   * Use this instead of client.cart directly for UI integration.
   */
  createCartManager(options?: CartManagerOptions): CartManager {
    return new CartManager(this, options);
  }
}
