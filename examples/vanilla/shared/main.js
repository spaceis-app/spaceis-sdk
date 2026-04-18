// examples/vanilla/shared/main.js
// Entry point: SDK init, cart manager, component orchestration.
// Loaded as <script type="module"> — replaces the old shared.js script tag.

import { SHOP_CONFIG } from "./config.js";
import { esc, fp, getErrorMessage, PLACEHOLDER_SVG_SM, PLACEHOLDER_SVG_MD, PLACEHOLDER_SVG_LG } from "./format.js";
import { showToast } from "./toast.js";
import { renderHeader, SHOP_TABS, SHOP_KEYS, setToggleCartCallback } from "./header.js";
import { renderFooter } from "./footer.js";
import {
  initCart,
  renderCartSummary,
  renderDiscountSection,
  renderSkeletons,
  handleQtyStepperClick,
  handleQtyInputChange,
  applyDiscountCode,
  removeDiscountCode,
  getVariantLimits,
} from "./cart.js";
import {
  initCartDrawer,
  toggleCart,
  clearCart,
  renderCartDrawer,
  renderCartItems,
  renderCartBadge,
  isCartOpen,
} from "./cart-drawer.js";
import {
  initRecommendations,
  renderRecsHtml,
  attachRecsClickHandler,
  loadCartRecommendations,
  loadRecsForFirstCartItem,
} from "./recommendations.js";
import {
  initModal,
  openProductModal,
  closeModal,
} from "./modal.js";
import {
  initCommunity,
  renderCommunitySection,
  loadCommunityData,
} from "./community.js";
import {
  initCategories,
  loadCategories,
  selectCategory,
} from "./categories.js";

// ── SDK client + cart manager (created once, shared across all modules) ────────

const client = window.SpaceIS.createSpaceIS(SHOP_CONFIG);
const cartMgr = client.createCartManager();

// Wire up the toggle callback in header (avoids circular import at top-level)
setToggleCartCallback(toggleCart);

// Init modules with shared state
initCart(client, cartMgr);          // state for shared primitives
initCartDrawer(client, cartMgr);    // drawer state + onChange subscription + initial render
initRecommendations(client, cartMgr);
initModal(client, cartMgr);
initCommunity(client);

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modalOverlay = document.getElementById("modal-overlay");
    if (modalOverlay?.classList.contains("open")) {
      closeModal();
      return;
    }
    // isCartOpen() imported from cart.js — read current state
    const overlay = document.getElementById("overlay");
    if (overlay?.classList.contains("open")) {
      toggleCart();
    }
  }
});

// ── Page routing + init ───────────────────────────────────────────────────────

const path = window.location.pathname;
const filename =
  path.substring(path.lastIndexOf("/") + 1).replace(".html", "") || "index";
const PAGE_KEY_MAP = {
  index: "products",
  packages: "packages",
  sales: "sales",
  voucher: "voucher",
  "daily-reward": "daily-reward",
  cart: "cart",
  checkout: "checkout",
  statute: "statute",
  page: "pages",
  "order-summary": "checkout",
};
const pageKey = PAGE_KEY_MAP[filename] || "products";

renderHeader(pageKey);
renderFooter();
// renderCartDrawer is called inside initCartDrawer — already done above

// Render community section on shop pages (products, packages, sales)
if (SHOP_KEYS.includes(pageKey)) {
  renderCommunitySection();
  loadCommunityData();
}

cartMgr.load().catch(() => {});

// ── window.ShopUI — expose functions needed by inline page scripts ────────────
// Only expose what is directly called from per-page <script> blocks.
// cart.html / checkout.html / index.html / packages.html reference these via
// the global cartMgr/client variables and the ShopUI namespace.

window.ShopUI = {
  // Core state (read-only references — per-page scripts use these directly)
  client,
  cartMgr,
  SHOP_CONFIG,

  // Format helpers
  esc,
  fp,
  getErrorMessage,

  // Placeholders
  PLACEHOLDER_SVG_SM,
  PLACEHOLDER_SVG_MD,
  PLACEHOLDER_SVG_LG,

  // Toast
  showToast,

  // Cart actions
  toggleCart,
  clearCart,
  applyDiscountCode,
  removeDiscountCode,
  renderCartBadge,
  renderCartItems,
  renderCartDrawer,
  renderCartSummary,
  renderDiscountSection,
  renderSkeletons,
  handleQtyStepperClick,
  handleQtyInputChange,
  getVariantLimits,
  loadCartRecommendations,

  // Modal
  openProductModal,
  closeModal,

  // Recommendations
  renderRecsHtml,
  attachRecsClickHandler,
  loadRecsForFirstCartItem,

  // Categories
  initCategories,
  loadCategories,
  selectCategory,
};

// Also expose everything from ShopUI as flat globals — per-page scripts reference
// them directly as `cartMgr`, `fp`, `showToast`, etc. Derived from the single
// window.ShopUI source of truth above to avoid drift between the two lists.
Object.assign(window, window.ShopUI);

// ── Signal that shared/main.js finished setting up globals ───────────────────
// <script type="module"> is deferred, so per-page synchronous <script> blocks
// execute before this file. Any code that touches window.cartMgr / window.client
// at top-level would hit `undefined`. Per-page scripts should register their
// init via `window.addEventListener("spaceis:ready", ...)` instead.
window.dispatchEvent(new CustomEvent("spaceis:ready", { detail: { client, cartMgr } }));
