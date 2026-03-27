export { SpaceISClient, type SpaceISOptions } from "./client";
export { CartManager, type CartManagerOptions } from "./cart-manager";
export { SpaceISError } from "./error";
export {
  fromApiQty,
  toApiQty,
  formatPrice,
  centsToAmount,
  getCartItemImage,
  getItemQty,
  getProductLimits,
  escapeHtml,
  type ProductLimits,
} from "./utils";
export type * from "./types";

// Convenience factory
import { SpaceISClient, type SpaceISOptions } from "./client";

/**
 * Create a new SpaceIS API client.
 *
 * This is the main entry point for the SDK. Pass your shop's
 * base URL and UUID to get started.
 *
 * @param options - Client configuration (baseUrl, shopUuid, lang, etc.)
 * @returns Configured {@link SpaceISClient} instance
 *
 * @example
 * ```ts
 * import { createSpaceIS } from '@spaceis/sdk';
 *
 * const client = createSpaceIS({
 *   baseUrl: 'https://storefront-api.spaceis.app',
 *   shopUuid: 'your-shop-uuid',
 *   lang: 'pl',
 * });
 *
 * const products = await client.products.list();
 * ```
 */
export function createSpaceIS(options: SpaceISOptions): SpaceISClient {
  return new SpaceISClient(options);
}
