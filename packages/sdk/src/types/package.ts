/**
 * Package (bundle) in list view.
 *
 * Packages group multiple products together at a discounted price.
 * Prices are in **cents**.
 */
export interface IndexPackage {
  /** The product wrapper for this package */
  shop_product: {
    uuid: string;
    name: string;
    slug: string;
    image: string | null;
  };
  /** Package metadata */
  package: {
    uuid: string;
    name: string;
  };
  /** Discount percentage compared to buying items separately, or `null` */
  percentage_discount: number | null;
  /** Lowest base price (before discount) in cents */
  minimal_base_price: number;
  /** Lowest current price in cents */
  minimal_price: number;
}

/**
 * Package recommendation for a product.
 *
 * Returned by `client.products.recommendations(slug)` and
 * `client.cart.recommendations()`. Suggests packages that include
 * the given product at a potentially better price.
 */
export interface PackageRecommendation {
  /** The product contained in the package */
  shop_product: {
    uuid: string;
    name: string;
    image: string | null;
    /** Minimum quantity in API thousandths, or `null` */
    min_quantity: number | null;
  };
  /** The specific variant in the package */
  variant: {
    uuid: string;
    name: string;
    image: string | null;
  };
  /** Original price in cents (buying separately) */
  base_price: number;
  /** Package price in cents (discounted) */
  price: number;
  /** Package display name */
  name: string;
}

/** Query parameters for the packages list endpoint */
export interface GetPackagesParams {
  /** Page number */
  page?: number;
  /** Filter by category UUID */
  category_uuid?: string;
  /** Filter by category slug */
  category_slug?: string;
  /** Filter by sale UUID */
  sale_uuid?: string;
  /** Filter by sale slug */
  sale_slug?: string;
  /** Additional query parameters */
  [key: string]: unknown;
}
