/**
 * Shop category in a recursive tree structure.
 *
 * Categories can be nested — use the `children` array to traverse
 * subcategories. The `parent` field references the parent category.
 */
export interface ShopCategory {
  /** Unique identifier */
  uuid: string;
  /** Category name */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** Category image URL, or `null` */
  image: string | null;
  /** Whether this category is active/visible */
  is_active: boolean;
  /** Parent category reference, or `null` for top-level */
  parent: { uuid: string } | null;
  /** Subcategories (recursive) */
  children: ShopCategory[];
}

/** Query parameters for the categories endpoint */
export interface GetCategoriesParams {
  /** Filter by active status */
  active?: boolean;
  /** Additional query parameters */
  [key: string]: unknown;
}
