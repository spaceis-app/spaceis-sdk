import type { RequestFn } from "../http";
import type { ShopPage, Statute, GetPagesParams } from "../types";

/**
 * Content API module.
 *
 * Access CMS pages and the shop statute/terms of service.
 * Pages contain HTML content managed through the SpaceIS admin panel.
 *
 * @example
 * ```ts
 * const pages = await client.content.pages({ visible_in_menu: true });
 * const about = await client.content.page('about-us');
 * const terms = await client.content.statute();
 * ```
 */
export class ContentModule {
  /** @internal */
  constructor(private request: RequestFn) {}

  /**
   * Get all CMS pages.
   *
   * @param params - Optional filters (visible, visible_in_menu)
   * @returns Array of pages with title, slug, and content
   */
  async pages(params?: GetPagesParams): Promise<ShopPage[]> {
    const res = await this.request<{ data: ShopPage[] }>("pages", { params });
    return res.data;
  }

  /**
   * Get a single CMS page by slug.
   *
   * @param slug - Page slug (e.g. `"about-us"`)
   * @returns Page with title, slug, and HTML content
   * @throws {@link SpaceISError} with status 404 if the page doesn't exist
   */
  async page(slug: string): Promise<ShopPage> {
    const res = await this.request<{ data: ShopPage }>(`pages/${encodeURIComponent(slug)}`);
    return res.data;
  }

  /**
   * Get the shop's legal statute (terms of service).
   *
   * @returns Statute object with HTML content
   */
  async statute(): Promise<Statute> {
    const res = await this.request<{ data: Statute }>("statute");
    return res.data;
  }
}
