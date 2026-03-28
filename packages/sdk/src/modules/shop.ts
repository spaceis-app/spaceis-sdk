import type { RequestFn } from "../http";
import type { TemplateConfiguration } from "../types";

/**
 * Shop API module.
 *
 * Retrieves the shop's template configuration — branding, layout,
 * navigation, footer, sections, and theme settings.
 *
 * @example
 * ```ts
 * const config = await client.shop.config();
 * console.log(config.app_name);       // "My Shop"
 * console.log(config.meta.accent_color); // "#7c3aed"
 * ```
 */
export class ShopModule {
  /** @internal */
  constructor(private request: RequestFn) {}

  /**
   * Get the full template/shop configuration.
   *
   * Includes app name, description, logo, favicon, navigation,
   * footer, sections, meta/OG tags, feature flags, and social links.
   *
   * @returns Complete template configuration object
   */
  async config(): Promise<TemplateConfiguration> {
    const res = await this.request<{ data: TemplateConfiguration }>("template");
    return res.data;
  }
}
