/** CMS page managed through the SpaceIS admin panel */
export interface ShopPage {
  /** Unique identifier */
  uuid: string;
  /** Short UUID variant */
  uuid_short?: string;
  /** Page title */
  title: string;
  /** URL-friendly slug (e.g. `"about-us"`) */
  slug: string;
  /** Page body content (HTML) */
  content: string;
  /** SEO meta tags for this page */
  meta: {
    title: string | null;
    description: string | null;
    keywords: string | null;
  };
  /** Open Graph metadata for social sharing */
  og: {
    title: string | null;
    description: string | null;
    url: string | null;
    image: string | null;
    type: string | null;
  };
  /** Whether the page is publicly visible */
  is_visible: boolean;
  /** Whether the page appears in navigation menus */
  is_visible_in_menu: boolean;
  /** Sort order for menu display */
  sort_order: number;
  /** Creation date (ISO 8601) */
  created_at: string;
  /** Last update date (ISO 8601) */
  updated_at: string;
}

/** Shop statute (terms of service / legal document) */
export interface Statute {
  /** Statute title, or `null` */
  title: string | null;
  /** Statute body content (HTML) */
  content: string;
  /** Creation date (ISO 8601) */
  created_at: string;
  /** Last update date (ISO 8601) */
  updated_at: string;
}

/** Query parameters for the pages list endpoint */
export interface GetPagesParams {
  /** Filter by visibility status */
  visible?: boolean;
  /** Filter by menu visibility */
  visible_in_menu?: boolean;
  /** Additional query parameters */
  [key: string]: unknown;
}
