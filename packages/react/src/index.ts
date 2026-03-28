// ── Provider ──────────────────────────────────────────────────────────────────
export { SpaceISProvider, useSpaceIS } from "./provider";
export type { SpaceISProviderProps, SpaceISContextValue } from "./provider";

// ── Hooks ─────────────────────────────────────────────────────────────────────
export * from "./hooks";

// ── Re-exports from @spaceis/sdk ──────────────────────────────────────────────
// Utilities and errors — so consumers need only one import for most use cases.

export {
  SpaceISError,
  formatPrice,
  fromApiQty,
  toApiQty,
  getItemQty,
  getProductLimits,
  getCartItemImage,
  centsToAmount,
  escapeHtml,
} from "@spaceis/sdk";

export type {
  // Client
  SpaceISOptions,
  CartManagerOptions,

  // Cart
  Cart,
  CartItem,
  CartItemShopProduct,
  CartItemVariant,
  CartItemPackage,
  CartItemFromPackage,
  CartItemSale,
  CartDiscount,
  CartDiscountSource,
  CartMutationResponse,

  // Products
  IndexShopProduct,
  ShowShopProduct,
  ShowShopProductVariant,
  ProductPackage,
  GetProductsParams,
  PackageRecommendation,

  // Categories
  ShopCategory,
  GetCategoriesParams,

  // Packages
  IndexPackage,
  GetPackagesParams,

  // Sales
  Sale,
  GetSalesParams,

  // Goals
  Goal,
  GetGoalsParams,

  // Rankings
  TopCustomer,
  LatestOrder,
  GetTopCustomersParams,
  GetLatestOrdersParams,

  // Checkout
  PaymentMethod,
  PaymentMethodType,
  Agreement,
  CheckoutRequest,
  CheckoutResponse,

  // Orders
  OrderSummary,
  OrderSummaryItem,
  OrderDiscountInfo,
  OrderStatus,

  // Content
  ShopPage,
  Statute,
  GetPagesParams,

  // Shop config
  TemplateConfiguration,
  FooterConfig,
  NavSection,
  NavLink,
  SectionsConfig,
  SectionConfig,
  MetaConfig,
  OgConfig,
  SimpleMediaFile,

  // Common
  PaginatedResponse,
  PaginationMeta,
  PaginationLinks,
  MessageResponse,

  // Utilities
  ProductLimits,

  // Vouchers / Daily Rewards
  UseVoucherRequest,
  UseDailyRewardRequest,
} from "@spaceis/sdk";
