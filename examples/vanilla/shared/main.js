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
  toggleCart,
  clearCart,
  renderCartDrawer,
  renderCartItems,
  renderCartBadge,
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
  initRecommendations,
  renderRecsHtml,
  attachRecsClickHandler,
  loadCartRecommendations,
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

// ── SDK client + cart manager (created once, shared across all modules) ────────

const client = window.SpaceIS.createSpaceIS(SHOP_CONFIG);
const cartMgr = client.createCartManager();

// Wire up the toggle callback in header (avoids circular import at top-level)
setToggleCartCallback(toggleCart);

// Init modules with shared state
initCart(client, cartMgr);
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
// renderCartDrawer is called inside initCart — already done above

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
};

// Also expose cartMgr and client directly on window for backward compatibility
// with per-page scripts that reference them as globals (cart.html, checkout.html).
window.cartMgr = cartMgr;
window.client = client;

// Expose format helpers as globals for per-page scripts using them directly
window.esc = esc;
window.fp = fp;
window.getErrorMessage = getErrorMessage;
window.PLACEHOLDER_SVG_SM = PLACEHOLDER_SVG_SM;
window.PLACEHOLDER_SVG_MD = PLACEHOLDER_SVG_MD;
window.PLACEHOLDER_SVG_LG = PLACEHOLDER_SVG_LG;
window.showToast = showToast;
window.toggleCart = toggleCart;
window.clearCart = clearCart;
window.openProductModal = openProductModal;
window.closeModal = closeModal;
window.renderCartBadge = renderCartBadge;
window.renderCartSummary = renderCartSummary;
window.renderDiscountSection = renderDiscountSection;
window.renderSkeletons = renderSkeletons;
window.renderCartItems = renderCartItems;
window.renderCartDrawer = renderCartDrawer;
window.handleQtyStepperClick = handleQtyStepperClick;
window.handleQtyInputChange = handleQtyInputChange;
window.applyDiscountCode = applyDiscountCode;
window.removeDiscountCode = removeDiscountCode;
window.getVariantLimits = getVariantLimits;
window.loadCartRecommendations = loadCartRecommendations;
window.renderRecsHtml = renderRecsHtml;
window.attachRecsClickHandler = attachRecsClickHandler;

// ── Signal that shared/main.js finished setting up globals ───────────────────
// <script type="module"> is deferred, so per-page synchronous <script> blocks
// execute before this file. Any code that touches window.cartMgr / window.client
// at top-level would hit `undefined`. Per-page scripts should register their
// init via `window.addEventListener("spaceis:ready", ...)` instead.
window.dispatchEvent(new CustomEvent("spaceis:ready", { detail: { client, cartMgr } }));
