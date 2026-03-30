"use strict";

// ══════════════════════════════════════════════════════════
//  CONFIGURATION
// ══════════════════════════════════════════════════════════

/**
 * Shop configuration — replace with your own values.
 * Get shopUuid from SpaceIS panel.
 */
const SHOP_CONFIG = {
  baseUrl: "https://storefront-api.spaceis.app",
  shopUuid: "xxx",
  lang: "pl",
};

// ══════════════════════════════════════════════════════════
//  SDK INIT
//  Creates API client and reactive cart manager.
//  Cart token is auto-generated and persisted in localStorage.
// ══════════════════════════════════════════════════════════

const client = SpaceIS.createSpaceIS(SHOP_CONFIG);
const cartMgr = client.createCartManager();

// ══════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════

let cartOpen = false;

// ══════════════════════════════════════════════════════════
//  HELPERS
//  Short aliases for SDK utilities used throughout all pages.
// ══════════════════════════════════════════════════════════

/** Escape HTML to prevent XSS — wraps SpaceIS.escapeHtml */
function esc(str) {
  return SpaceIS.escapeHtml(str == null ? "" : String(str));
}

/** Format price from cents → "12,99 zł" — wraps SpaceIS.formatPrice */
function fp(cents) {
  return SpaceIS.formatPrice(cents);
}

/** Extract user-friendly error message from SDK error */
function getErrorMessage(err) {
  if (!err) return "An error occurred";
  if (SpaceIS.SpaceISError && err instanceof SpaceIS.SpaceISError) {
    if (err.isValidation) {
      const all = err.allFieldErrors?.() ?? [];
      if (all.length > 0) return all[0];
    }
    return err.message || "An error occurred";
  }
  return err.message || "An error occurred";
}

/**
 * Sanitize an HTML container — removes dangerous elements and attributes.
 * Strips scripts, styles, iframes, and all inline event handlers / javascript: URLs.
 */
function sanitizeHtml(container) {
  container.querySelectorAll("script, style, iframe, object, embed, form").forEach((el) => {
    el.remove();
  });
  container.querySelectorAll("*").forEach((el) => {
    const attrs = el.attributes;
    for (let i = attrs.length - 1; i >= 0; i--) {
      const name = attrs[i].name.toLowerCase();
      if (name.startsWith("on")) {
        el.removeAttribute(attrs[i].name);
      }
    }
    if (el.hasAttribute("href")) {
      const href = (el.getAttribute("href") || "").trim().toLowerCase();
      if (href.startsWith("javascript:")) {
        el.removeAttribute("href");
      }
    }
    if (el.hasAttribute("src")) {
      const src = (el.getAttribute("src") || "").trim().toLowerCase();
      if (src.startsWith("javascript:")) {
        el.removeAttribute("src");
      }
    }
  });
}

// ══════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════

function showToast(message, type) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  if (type === "error") toast.className += " error";
  if (type === "success") toast.className += " success";
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}

// ══════════════════════════════════════════════════════════
//  SKELETON LOADERS
// ══════════════════════════════════════════════════════════

function renderSkeletons(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const grid = document.createElement("div");
  grid.className = "products-grid";
  for (let i = 0; i < (count || 8); i++) {
    grid.innerHTML +=
      '<div class="skeleton-card">' +
      '<div class="skeleton skeleton-img"></div>' +
      '<div class="skeleton-body">' +
      '<div class="skeleton skeleton-line"></div>' +
      '<div class="skeleton skeleton-line short"></div>' +
      '<div class="skeleton skeleton-line price"></div>' +
      "</div>" +
      "</div>";
  }
  container.innerHTML = "";
  container.appendChild(grid);
}

// ══════════════════════════════════════════════════════════
//  HEADER & FOOTER RENDER
// ══════════════════════════════════════════════════════════

// Pages that show the shop sub-tabs
const SHOP_TABS = [
  { href: "index.html", label: "Products", key: "products" },
  { href: "packages.html", label: "Packages", key: "packages" },
  { href: "sales.html", label: "Sales", key: "sales" },
];
const SHOP_KEYS = SHOP_TABS.map((t) => t.key);

function renderHeader(activePage) {
  const headerEl = document.getElementById("site-header");
  if (!headerEl) return;

  const shopActive = SHOP_KEYS.includes(activePage);

  const navLinksHtml =
    `<li><a href="index.html"${shopActive ? ' class="active"' : ''}>Shop</a></li>` +
    `<li><a href="voucher.html"${activePage === 'voucher' ? ' class="active"' : ''}>Voucher</a></li>` +
    `<li><a href="daily-reward.html"${activePage === 'daily-reward' ? ' class="active"' : ''}>Daily Reward</a></li>` +
    `<li><a href="page.html"${activePage === 'pages' ? ' class="active"' : ''}>Pages</a></li>` +
    `<li><a href="statute.html"${activePage === 'statute' ? ' class="active"' : ''}>Terms</a></li>`;

  headerEl.innerHTML =
    '<div class="container">' +
      '<div class="header-inner">' +
        '<a href="index.html" class="nav-logo">SpaceIS</a>' +
        `<ul class="nav-links">${navLinksHtml}</ul>` +
        '<div class="header-actions">' +
          '<button class="btn-cart-icon" id="cart-btn-header" aria-label="Cart">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>' +
              '<line x1="3" y1="6" x2="21" y2="6"/>' +
              '<path d="M16 10a4 4 0 01-8 0"/>' +
            '</svg>' +
            '<span class="cart-badge-dot" id="cart-badge"></span>' +
          '</button>' +
          '<button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Menu">' +
            '<span class="hamburger-line"></span>' +
            '<span class="hamburger-line"></span>' +
            '<span class="hamburger-line"></span>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  // Append overlay and mobile menu directly to body so they cover the full page
  const overlay = document.createElement('div');
  overlay.className = 'mobile-menu-overlay';
  overlay.id = 'mobile-menu-overlay';
  document.body.appendChild(overlay);

  const mobileNav = document.createElement('nav');
  mobileNav.className = 'mobile-menu';
  mobileNav.id = 'mobile-menu';
  mobileNav.innerHTML = `<ul class="mobile-menu-links">${navLinksHtml}</ul>`;
  document.body.appendChild(mobileNav);

  // Sub-tabs for shop pages
  if (shopActive) {
    const tabsHtml = SHOP_TABS.map((tab) => {
      const isActive = tab.key === activePage;
      return `<a href="${tab.href}" class="sub-tab${isActive ? ' active' : ''}">${tab.label}</a>`;
    }).join('');

    const subBar = document.createElement('div');
    subBar.className = 'sub-tabs-bar';
    subBar.innerHTML = `<div class="container"><div class="sub-tabs">${tabsHtml}</div></div>`;
    headerEl.appendChild(subBar);
  }

  document.getElementById("cart-btn-header").addEventListener("click", () => {
    toggleCart();
  });

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileOverlay = document.getElementById("mobile-menu-overlay");

  const openMobileMenu = () => {
    mobileMenuBtn.classList.add("active");
    mobileMenu.classList.add("open");
    mobileOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
  };

  const closeMobileMenu = () => {
    mobileMenuBtn.classList.remove("active");
    mobileMenu.classList.remove("open");
    mobileOverlay.classList.remove("open");
    document.body.style.overflow = "";
  };

  mobileMenuBtn.addEventListener("click", () => {
    if (mobileMenu.classList.contains("open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  mobileOverlay.addEventListener("click", () => {
    closeMobileMenu();
  });

  // Close mobile menu when a link is clicked
  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileMenu();
    });
  });
}

function renderFooter() {
  const footerEl = document.getElementById("site-footer");
  if (!footerEl) return;
  footerEl.className = "site-footer";
  footerEl.innerHTML =
    '<div class="container">' +
      '<span class="footer-text">Powered by <strong>SpaceIS SDK</strong> v0.1.4</span>' +
    '</div>';
}

// ══════════════════════════════════════════════════════════
//  SHARED UI HELPERS
//  Reusable constants and functions used across all pages.
// ══════════════════════════════════════════════════════════

// SVG placeholder images at three sizes — avoids repeating inline SVG
const PLACEHOLDER_SVG_SM = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
const PLACEHOLDER_SVG_MD = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
const PLACEHOLDER_SVG_LG = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';

// Product limits cache shared across all pages (cart drawer, cart page, checkout)
const _limitsCache = {};

/**
 * Fetch quantity limits (min/max/step) for a cart variant.
 * Results are cached so the product API is called at most once per variant.
 */
async function getVariantLimits(variantUuid) {
  if (_limitsCache[variantUuid]) return _limitsCache[variantUuid];
  const item = cartMgr.items.find((i) => i.variant?.uuid === variantUuid);
  if (!item?.shop_product) return { min: 1, max: 99, step: 1 };
  try {
    const product = await client.products.get(item.shop_product.uuid);
    const limits = SpaceIS.getProductLimits(product);
    _limitsCache[variantUuid] = limits;
    return limits;
  } catch {
    return { min: 1, max: 99, step: 1 };
  }
}

/**
 * Shared click handler for qty steppers (+/−) and remove buttons.
 * Works with both data-uuid (drawer/cart page) and data-variant (checkout).
 * Returns true when a matching action was handled, false otherwise.
 */
function handleQtyStepperClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn || btn.disabled) return false;
  const action = btn.dataset.action;

  // "remove" action — explicit remove button
  if (action === "remove") {
    const ruuid = btn.dataset.uuid;
    if (ruuid) {
      btn.disabled = true;
      cartMgr.remove(ruuid)
        .catch((err) => { showToast(getErrorMessage(err), "error"); })
        .finally(() => { btn.disabled = false; });
    }
    return true;
  }

  // +/− stepper (supports both plus/minus and inc/dec naming conventions)
  const isPlus = action === "plus" || action === "inc";
  const isMinus = action === "minus" || action === "dec";
  if (!isPlus && !isMinus) return false;

  // UUID comes from data-uuid on the button, or data-variant on the parent .qty-stepper
  const stepper = btn.closest(".qty-stepper");
  const uuid = btn.dataset.uuid || stepper?.dataset.variant || "";
  if (!uuid) return false;

  btn.disabled = true;
  const currentQty = cartMgr.getQuantity(uuid);

  (async () => {
    try {
      const limits = await getVariantLimits(uuid);
      let newQty;
      if (isPlus) {
        newQty = currentQty + limits.step;
        if (newQty > limits.max) {
          showToast(`Maximum ${limits.max} items`, "error");
          return;
        }
      } else {
        newQty = currentQty - limits.step;
        if (newQty < limits.min) {
          await cartMgr.remove(uuid);
          return;
        }
      }
      await cartMgr.setQuantity(uuid, newQty);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      cartMgr.load().catch(() => {});
    } finally {
      btn.disabled = false;
    }
  })();
  return true;
}

/**
 * Shared change handler for qty text inputs.
 * Looks for UUID via data-uuid or parent .qty-stepper[data-variant].
 * Validates against product limits (min/max/step) before updating.
 */
function handleQtyInputChange(e) {
  if (!e.target.classList.contains("qty-input")) return;
  const input = e.target;
  const stepper = input.closest(".qty-stepper");
  const uuid = input.dataset.uuid || stepper?.dataset.variant || "";
  if (!uuid) return;
  const rawQty = parseInt(input.value, 10);
  if (isNaN(rawQty) || rawQty < 1) {
    input.value = cartMgr.getQuantity(uuid) || 1;
    return;
  }
  input.disabled = true;
  (async () => {
    try {
      const limits = await getVariantLimits(uuid);
      const newQty = SpaceIS.snapQuantity(rawQty, limits);

      if (newQty < limits.min) {
        await cartMgr.remove(uuid);
        return;
      }
      input.value = newQty;
      await cartMgr.setQuantity(uuid, newQty);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      input.value = cartMgr.getQuantity(uuid) || 1;
    } finally {
      input.disabled = false;
    }
  })();
}

/**
 * Render the discount code section (apply form or active badge) into containerEl.
 * @param {Element} containerEl  Target element whose innerHTML will be replaced.
 * @param {Object}  [opts]       Optional ID overrides: inputId, applyId, removeId.
 */
function renderDiscountSection(containerEl, opts) {
  opts = opts || {};
  const inputId = opts.inputId || "shared-discount-input";
  const applyId = opts.applyId || "shared-discount-apply";
  const removeId = opts.removeId || "shared-discount-remove";

  if (cartMgr.hasDiscount) {
    containerEl.innerHTML =
      '<div class="discount-active">' +
        `<span>Code: <strong>${esc(cartMgr.discount.code)}</strong></span>` +
        `<span class="discount-active-pct">-${cartMgr.discount.percentage_discount}%</span>` +
        `<button class="discount-remove" id="${removeId}">Remove</button>` +
      '</div>';
    document.getElementById(removeId).addEventListener("click", () => {
      removeDiscountCode();
    });
  } else {
    containerEl.innerHTML =
      '<div class="discount-row">' +
        `<input type="text" placeholder="Discount code" id="${inputId}" autocomplete="off">` +
        `<button class="discount-apply" id="${applyId}">Apply</button>` +
      '</div>';
    document.getElementById(applyId).addEventListener("click", () => {
      const code = document.getElementById(inputId).value.trim();
      if (!code) return;
      cartMgr.applyDiscount(code)
        .then(() => { showToast("Discount applied!", "success"); })
        .catch((e) => { showToast(getErrorMessage(e) || "Invalid code", "error"); });
    });
  }
}

/**
 * Render the cart price summary (subtotal, discount, total) into containerEl.
 * @param {Element} containerEl  Target element whose innerHTML will be replaced.
 * @param {Object}  [opts]       Optional labels: header, subtotalLabel, totalLabel.
 */
function renderCartSummary(containerEl, opts) {
  opts = opts || {};
  const itemCount = cartMgr.totalQuantity;
  let html = '';
  html += `<div class="cart-summary-header">${opts.header || 'Subtotal'} (${itemCount})</div>`;
  html += `<div class="cart-summary-row"><span>${opts.subtotalLabel || 'Subtotal'}</span><span>${fp(cartMgr.regularPrice)}</span></div>`;

  const discountAmount = cartMgr.regularPrice - cartMgr.finalPrice;
  if (discountAmount > 0) {
    const discountLabel = cartMgr.hasDiscount && cartMgr.discount
      ? `Discount (${cartMgr.discount.percentage_discount}%)`
      : 'Discount';
    html += `<div class="cart-summary-row cart-summary-discount"><span>${discountLabel}</span><span>-${fp(discountAmount)}</span></div>`;
  }

  html += `<div class="cart-summary-total"><span>${opts.totalLabel || 'Total'}</span><span>${fp(cartMgr.finalPrice)}</span></div>`;
  containerEl.innerHTML = html;
}

// ══════════════════════════════════════════════════════════
//  CART DRAWER
// ══════════════════════════════════════════════════════════

function renderCartDrawer() {
  const drawerEl = document.getElementById("site-cart-drawer");
  if (!drawerEl) return;

  // Cart drawer HTML — matches multi-tenant DefaultCartDrawer layout
  drawerEl.innerHTML =
    '<div class="overlay" id="overlay"></div>' +
    '<div class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Cart">' +

      // Header: uppercase title + count + close
      '<div class="drawer-header">' +
        '<span class="drawer-title" id="drawer-title">CART</span>' +
        '<button class="close-btn" id="drawer-close-btn" aria-label="Close">&#10005;</button>' +
      '</div>' +

      // Body: scrollable items
      '<div class="drawer-body" id="cart-items"></div>' +

      // Footer: discount → summary panel → 2 action buttons
      '<div class="drawer-footer" id="cart-footer" style="display:none">' +
        '<div id="discount-section"></div>' +
        '<div class="cart-summary-panel" id="cart-totals"></div>' +
        '<div class="cart-actions">' +
          '<button class="cart-action-primary" id="go-checkout-btn">' +
            'Proceed to checkout <span style="margin-left:6px">&#8594;</span>' +
          '</button>' +
          '<button class="cart-action-secondary" id="go-cart-btn">View cart</button>' +
        '</div>' +
      '</div>' +

    '</div>';

  // Template for cart item — cloned per item in renderCartItems()
  const tpl = document.createElement('template');
  tpl.id = 'cart-item-tpl';
  tpl.innerHTML =
    '<li class="cart-item">' +
      '<div class="cart-item-img-wrap"></div>' +
      '<div class="cart-item-details">' +
        '<div class="cart-item-top">' +
          '<div class="cart-item-info">' +
            '<div class="cart-item-name"></div>' +
            '<div class="cart-item-variant"></div>' +
            '<div class="cart-item-package"></div>' +
          '</div>' +
          '<button class="cart-item-remove" data-action="remove" aria-label="Remove">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="cart-item-bottom">' +
          '<div class="cart-item-prices"></div>' +
          '<div class="cart-item-qty"></div>' +
        '</div>' +
      '</div>' +
    '</li>';
  drawerEl.appendChild(tpl);

  document.getElementById("overlay").addEventListener("click", () => {
    toggleCart();
  });
  document.getElementById("drawer-close-btn").addEventListener("click", () => {
    toggleCart();
  });

  document.getElementById("go-checkout-btn").addEventListener("click", () => {
    toggleCart();
    window.location.href = "checkout.html";
  });
  document.getElementById("go-cart-btn").addEventListener("click", () => {
    toggleCart();
    window.location.href = "cart.html";
  });

  // Event delegation on drawer element (set ONCE, survives innerHTML re-renders)
  const drawerBody = document.getElementById("drawer");
  if (!drawerBody) return;

  drawerBody.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.id === "discount-input") {
      applyDiscountCode();
    }
    if (e.key === "Enter" && e.target.classList.contains("qty-input")) {
      e.preventDefault();
      e.target.blur();
    }
  });

  // Delegate qty stepper clicks and input changes to shared handlers
  drawerBody.addEventListener("click", (e) => {
    handleQtyStepperClick(e);
  });

  drawerBody.addEventListener("change", (e) => {
    handleQtyInputChange(e);
  });
}

function toggleCart() {
  cartOpen = !cartOpen;
  const overlay = document.getElementById("overlay");
  const drawer = document.getElementById("drawer");
  if (overlay) overlay.classList.toggle("open", cartOpen);
  if (drawer) drawer.classList.toggle("open", cartOpen);
  document.body.style.overflow = cartOpen ? "hidden" : "";
}

function clearCart() {
  if (!confirm("Clear cart?")) return;
  cartMgr.clear();
  showToast("Cart cleared", "default");
}

// ══════════════════════════════════════════════════════════
//  CART RENDERING (reactive)
// ══════════════════════════════════════════════════════════

cartMgr.onChange(() => {
  renderCartBadge();
  renderCartItems();
});

function renderCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  const count = cartMgr.totalQuantity;
  if (count > 0) {
    const prev = badge.textContent;
    badge.textContent = count;
    badge.classList.add("visible");
    if (String(prev) !== String(count)) {
      badge.style.animation = "none";
      void badge.offsetWidth;
      badge.style.animation = "";
    }
  } else {
    badge.textContent = "";
    badge.classList.remove("visible");
  }
}

function renderCartItems() {
  const itemsEl = document.getElementById("cart-items");
  const footerEl = document.getElementById("cart-footer");
  const titleEl = document.getElementById("drawer-title");
  if (!itemsEl) return;

  // Update header count
  const totalQty = cartMgr.totalQuantity;
  if (titleEl) titleEl.textContent = `CART${totalQty > 0 ? ` (${totalQty})` : ""}`;

  // Show spinner only on initial load, not during mutations
  if (cartMgr.isLoading && !cartMgr.cart) {
    itemsEl.innerHTML = '<div class="spinner"></div>';
    if (footerEl) footerEl.style.display = "none";
    return;
  }

  if (cartMgr.isEmpty) {
    itemsEl.innerHTML =
      '<div class="empty-state">' +
        '<div class="icon">&#128722;</div>' +
        '<p>Your cart is empty</p>' +
        '<button class="cart-action-secondary" onclick="toggleCart()" style="margin-top:16px">Continue Shopping</button>' +
      '</div>';
    if (footerEl) footerEl.style.display = "none";
    return;
  }

  if (footerEl) footerEl.style.display = "";

  // Try incremental update — only patch qty/prices if same items exist
  const existingItems = itemsEl.querySelectorAll(".cart-item");
  const currentUuids = cartMgr.items.map((i) => i.variant?.uuid ?? "");
  const existingUuids = Array.from(existingItems).map((el) => {
    const rm = el.querySelector(".cart-item-remove");
    return rm ? rm.dataset.uuid : "";
  });

  const sameItems = currentUuids.length === existingUuids.length &&
    currentUuids.every((uuid, i) => uuid === existingUuids[i]);
  const prevDiscountEl = document.getElementById("discount-section");
  const hadDiscount = prevDiscountEl?.querySelector(".discount-active");
  const sameDiscount = !!hadDiscount === cartMgr.hasDiscount;

  if (sameItems && sameDiscount && existingItems.length > 0) {
    // Incremental update — only patch changed values (no DOM rebuild)
    cartMgr.items.forEach((item, i) => {
      const li = existingItems[i];
      const displayQty = SpaceIS.getItemQty(item);

      // Update qty input (only if not focused)
      const qtyInput = li.querySelector(".qty-input");
      if (qtyInput && document.activeElement !== qtyInput) {
        qtyInput.value = displayQty;
      }

      // Update prices
      const pricesEl = li.querySelector(".cart-item-prices");
      if (pricesEl) {
        let priceHtml = `<span class="cart-item-price-current">${fp(item.final_price_value)}</span>`;
        if (item.regular_price_value !== item.final_price_value) {
          priceHtml += ` <span class="cart-item-price-old">${fp(item.regular_price_value)}</span>`;
        }
        pricesEl.innerHTML = priceHtml;
      }
    });
  } else {
    // Full re-render — items added/removed
    const tpl = document.getElementById("cart-item-tpl");
    const list = document.createElement("ul");
    list.className = "cart-items-list";

    cartMgr.items.forEach((item) => {
      const clone = tpl.content.cloneNode(true);
      const li = clone.querySelector(".cart-item");
      const imgWrap = clone.querySelector(".cart-item-img-wrap");
      const nameEl = clone.querySelector(".cart-item-name");
      const variantEl = clone.querySelector(".cart-item-variant");
      const packageEl = clone.querySelector(".cart-item-package");
      const removeBtn = clone.querySelector(".cart-item-remove");
      const pricesEl = clone.querySelector(".cart-item-prices");
      const qtyEl = clone.querySelector(".cart-item-qty");

      const variantUuid = item.variant?.uuid ?? "";
      const imgSrc = SpaceIS.getCartItemImage(item);
      const displayQty = SpaceIS.getItemQty(item);
      const showVariant = item.variant && item.shop_product && item.variant.name !== item.shop_product?.name;

      if (imgSrc) {
        imgWrap.innerHTML = `<img class="cart-item-img" src="${esc(imgSrc)}" alt="">`;
      } else {
        imgWrap.innerHTML = `<div class="cart-item-img-placeholder">${PLACEHOLDER_SVG_SM}</div>`;
      }

      nameEl.textContent = item.shop_product?.name ?? "";

      if (showVariant) {
        variantEl.textContent = item.variant.name;
      } else {
        variantEl.style.display = "none";
      }

      if (item.package) {
        packageEl.textContent = `Package: ${item.package.name}`;
        packageEl.style.display = "";
      } else {
        packageEl.style.display = "none";
      }

      removeBtn.dataset.uuid = variantUuid;

      let priceHtml = `<span class="cart-item-price-current">${fp(item.final_price_value)}</span>`;
      if (item.regular_price_value !== item.final_price_value) {
        priceHtml += ` <span class="cart-item-price-old">${fp(item.regular_price_value)}</span>`;
      }
      pricesEl.innerHTML = priceHtml;

      qtyEl.innerHTML =
        '<div class="qty-stepper">' +
          `<button class="qty-step-btn" data-action="minus" data-uuid="${esc(variantUuid)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>` +
          `<input class="qty-input" type="text" inputmode="numeric" value="${displayQty}" data-uuid="${esc(variantUuid)}">` +
          `<button class="qty-step-btn" data-action="plus" data-uuid="${esc(variantUuid)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>` +
        '</div>';

      list.appendChild(clone);
    });

    itemsEl.innerHTML = "";
    itemsEl.appendChild(list);
  }

  // ── Discount section ──
  const discountEl = document.getElementById("discount-section");
  if (discountEl) {
    renderDiscountSection(discountEl, {
      inputId: "discount-input",
      applyId: "discount-apply-btn",
      removeId: "discount-remove-btn",
    });
  }

  // ── Summary panel (matches multi-tenant CartSummary) ──
  const totalsEl = document.getElementById("cart-totals");
  if (totalsEl) {
    renderCartSummary(totalsEl);
  }
}

// ══════════════════════════════════════════════════════════
//  SHARED RECOMMENDATION RENDERING
//  Used by product modal, cart drawer, and checkout.
// ══════════════════════════════════════════════════════════

function renderRecsHtml(recs, title) {
  let html = '<div class="recs-section">';
  html += `<div class="recs-section-title">${esc(title || "Recommended")}</div>`;
  html += '<div class="recs-grid">';
  (recs || []).forEach((rec) => {
    const minQty = rec.shop_product?.min_quantity
      ? SpaceIS.fromApiQty(rec.shop_product.min_quantity)
      : 1;
    const imgSrc = rec.variant?.image || rec.shop_product?.image || null;
    const imgHtml = imgSrc
      ? `<img class="rec-img" src="${esc(imgSrc)}" alt="">`
      : `<div class="rec-img-placeholder">${PLACEHOLDER_SVG_SM}</div>`;

    html +=
      `<div class="rec-card" data-variant-uuid="${esc(rec.variant?.uuid ?? "")}">` +
      imgHtml +
      '<div class="rec-info">' +
      `<div class="rec-name">${esc(rec.name || rec.shop_product?.name || "")}</div>` +
      '<div class="rec-price-row">' +
      `<span class="rec-price">${fp(rec.price * minQty)}</span>` +
      (rec.base_price !== rec.price
        ? `<span class="rec-old-price">${fp(rec.base_price * minQty)}</span>`
        : "") +
      (minQty > 1 ? `<span class="rec-qty-label">(${minQty} pcs.)</span>` : "") +
      "</div>" +
      "</div>" +
      '<button class="rec-add-btn" title="Add to cart" aria-label="Add to cart">+</button>' +
      "</div>";
  });
  html += "</div></div>";
  return html;
}

function attachRecsClickHandler(container, recs) {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".rec-add-btn");
    if (!btn) return;
    const card = btn.closest(".rec-card");
    const variantUuid = card ? card.dataset.variantUuid : null;
    if (!variantUuid) return;

    let minQty = 1;
    (recs || []).forEach((r) => {
      if (
        r.variant &&
        r.variant.uuid === variantUuid &&
        r.shop_product &&
        r.shop_product.min_quantity
      ) {
        minQty = SpaceIS.fromApiQty(r.shop_product.min_quantity);
      }
    });

    btn.disabled = true;
    btn.textContent = "...";
    cartMgr
      .add(variantUuid, minQty)
      .then(() => {
        showToast("Added to cart!", "success");
        btn.textContent = "\u2713";
        setTimeout(() => {
          btn.textContent = "+";
          btn.disabled = false;
        }, 1500);
      })
      .catch((err) => {
        showToast(getErrorMessage(err), "error");
        btn.textContent = "+";
        btn.disabled = false;
      });
  });
}

async function loadCartRecommendations() {
  let container = document.getElementById("cart-recommendations");
  if (!container) {
    // Create container in drawer body if it doesn't exist
    const body = document.getElementById("cart-items");
    if (!body) return;
    const div = document.createElement("div");
    div.id = "cart-recommendations";
    div.className = "cart-recs";
    body.parentNode.insertBefore(div, document.getElementById("cart-footer"));
    container = div;
  }

  if (cartMgr.isEmpty) {
    container.innerHTML = "";
    return;
  }

  const firstItem = cartMgr.items[0];
  if (!firstItem?.shop_product) {
    container.innerHTML = "";
    return;
  }

  try {
    const recs = await client.products.recommendations(firstItem.shop_product.uuid);
    if (!recs?.length) {
      container.innerHTML = "";
      return;
    }
    const sliced = recs.slice(0, 4);
    container.innerHTML = renderRecsHtml(sliced, "You might also like");
    attachRecsClickHandler(container, sliced);
  } catch {
    container.innerHTML = "";
  }
}

async function applyDiscountCode() {
  const input = document.getElementById("discount-input");
  if (!input) return;
  const code = input.value.trim();
  if (!code) {
    showToast("Enter discount code", "error");
    return;
  }

  const btn = document.getElementById("discount-apply-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "...";
  }

  try {
    await cartMgr.applyDiscount(code);
    showToast("Discount applied!", "success");
  } catch (err) {
    showToast(getErrorMessage(err) || "Invalid code", "error");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Apply";
    }
  }
}

function removeDiscountCode() {
  cartMgr.removeDiscount().catch((err) => {
    showToast(getErrorMessage(err), "error");
  });
}

// ══════════════════════════════════════════════════════════
//  PRODUCT DETAIL MODAL (shared — used by index & packages)
// ══════════════════════════════════════════════════════════

const productModalState = {
  product: null,
  selectedVariantUuid: null,
  quantity: 1,
};

function renderModalShell() {
  const existing = document.getElementById("modal-overlay");
  if (existing) return;
  const div = document.createElement("div");
  div.innerHTML =
    '<div class="modal-overlay" id="modal-overlay">' +
    '<div class="modal" id="product-modal" role="dialog" aria-modal="true">' +
    '<button class="modal-close" id="modal-close-btn" aria-label="Close">&#10005;</button>' +
    '<div id="modal-content"></div>' +
    "</div>" +
    "</div>";
  document.body.appendChild(div.firstChild);

  document.getElementById("modal-close-btn").addEventListener("click", () => {
    closeModal();
  });
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-overlay")) closeModal();
  });
}

async function openProductModal(slug) {
  renderModalShell();
  const overlay = document.getElementById("modal-overlay");
  const content = document.getElementById("modal-content");

  content.innerHTML = '<div style="padding:40px"><div class="spinner"></div></div>';
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";

  try {
    const product = await client.products.get(slug);
    productModalState.product = product;
    const firstVariant = product.variants?.[0] ?? null;
    productModalState.selectedVariantUuid = firstVariant?.uuid ?? null;
    const limits = SpaceIS.getProductLimits(product);
    productModalState.quantity = limits.min;
    renderModalContent(product);
  } catch {
    content.innerHTML =
      '<div class="modal-body">' +
      '<div class="empty-state"><p style="color:var(--red)">Failed to load product.</p></div>' +
      "</div>";
  }
}

function renderModalContent(product) {
  const content = document.getElementById("modal-content");

  const imgHtml = product.image
    ? `<img class="modal-img" src="${esc(product.image)}" alt="${esc(product.name)}">`
    : `<div class="modal-img-placeholder">${PLACEHOLDER_SVG_SM}</div>`;

  let descHtml = "";
  if (product.description) {
    const temp = document.createElement("div");
    temp.innerHTML = product.description;
    sanitizeHtml(temp);
    descHtml = `<div class="modal-desc">${temp.innerHTML}</div>`;
  }

  const selectedVariant = getSelectedVariant(product);
  const currentPrice = selectedVariant?.price
    ?? product.variants?.[0]?.price
    ?? product.base_price;
  const basePrice = selectedVariant ? selectedVariant.base_price : null;

  let variantsHtml = "";
  if (product.variants?.length > 0) {
    variantsHtml =
      '<div class="modal-label">Choose variant</div><div class="variants-grid" id="modal-variants">';
    product.variants.forEach((v) => {
      const isActive = v.uuid === productModalState.selectedVariantUuid ? " active" : "";
      variantsHtml +=
        `<button class="variant-btn${isActive}" data-uuid="${esc(v.uuid)}">${esc(v.name)}</button>`;
    });
    variantsHtml += "</div>";
  }

  const limits = SpaceIS.getProductLimits(product);
  const minQty = limits.min;
  const maxQty = limits.max;
  const step = limits.step;
  const showQtySelector = !(minQty === 1 && maxQty === 1 && step === 1);
  const qty = Math.max(productModalState.quantity, minQty);
  productModalState.quantity = qty;

  const oldPriceHtml =
    basePrice && basePrice !== currentPrice
      ? `<div class="modal-price-old" id="modal-price-old">${fp(basePrice)}</div>`
      : '<div class="modal-price-old" id="modal-price-old" style="display:none"></div>';

  let lowestHtml = "";
  if (selectedVariant?.lowest_price_last_30_days) {
    lowestHtml =
      `<div class="modal-price-note" id="modal-price-lowest">Lowest in 30 days: ${fp(selectedVariant.lowest_price_last_30_days)}</div>`;
  } else {
    lowestHtml = '<div class="modal-price-note" id="modal-price-lowest" style="display:none"></div>';
  }

  content.innerHTML =
    imgHtml +
    '<div class="modal-body">' +
    `<div class="modal-title">${esc(product.name)}</div>` +
    descHtml +
    variantsHtml +
    '<div class="modal-qty-row">' +
    (showQtySelector
      ? "<div>" +
        '<div class="modal-label" style="margin-bottom:6px">Quantity</div>' +
        '<div class="qty-stepper">' +
        '<button class="qty-step-btn" id="modal-qty-minus" aria-label="Decrease"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>' +
        `<input class="qty-step-input" id="modal-qty-val" type="number" min="${minQty}" max="${maxQty}" step="${step}" value="${qty}">` +
        '<button class="qty-step-btn" id="modal-qty-plus" aria-label="Increase"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>' +
        "</div>" +
        "</div>"
      : "") +
    '<div class="modal-price-block">' +
    `<div class="modal-price" id="modal-price">${fp(currentPrice)}</div>` +
    oldPriceHtml +
    lowestHtml +
    "</div>" +
    "</div>" +
    '<button class="modal-add-btn" id="modal-add-btn">Add to cart</button>' +
    '<div id="modal-recommendations" class="modal-recommendations"></div>' +
    "</div>";

  loadProductRecommendations(product.slug);

  const variantsEl = document.getElementById("modal-variants");
  if (variantsEl) {
    variantsEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".variant-btn");
      if (!btn) return;
      productModalState.selectedVariantUuid = btn.dataset.uuid;
      variantsEl.querySelectorAll(".variant-btn").forEach((b) => {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      updateModalPrice(product);
    });
  }

  // Qty stepper (only if selector is shown)
  if (showQtySelector) {
    const qtyMinus = document.getElementById("modal-qty-minus");
    const qtyPlus = document.getElementById("modal-qty-plus");
    const qtyInput = document.getElementById("modal-qty-val");

    qtyMinus.addEventListener("click", () => {
      const newQty = productModalState.quantity - step;
      if (newQty < minQty) return;
      productModalState.quantity = newQty;
      qtyInput.value = String(newQty);
      qtyMinus.disabled = newQty <= minQty;
      qtyPlus.disabled = false;
    });
    qtyPlus.addEventListener("click", () => {
      const newQty = productModalState.quantity + step;
      if (newQty > maxQty) return;
      productModalState.quantity = newQty;
      qtyInput.value = String(newQty);
      qtyPlus.disabled = newQty >= maxQty;
      qtyMinus.disabled = false;
    });
    qtyMinus.disabled = qty <= minQty;
    qtyPlus.disabled = qty >= maxQty;

    // Manual input — snap to valid value on blur/change
    qtyInput.addEventListener("change", () => {
      let val = parseInt(qtyInput.value, 10);
      if (isNaN(val)) val = productModalState.quantity;
      val = SpaceIS.snapQuantity(val, { min: minQty, max: maxQty, step });
      qtyInput.value = val;
      productModalState.quantity = val;
      qtyMinus.disabled = val <= minQty;
      qtyPlus.disabled = val >= maxQty;
    });
    qtyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        qtyInput.blur();
      }
    });
  }

  const addBtn = document.getElementById("modal-add-btn");
  addBtn.addEventListener("click", () => {
    if (!productModalState.selectedVariantUuid) {
      showToast("Choose variant", "error");
      return;
    }
    // Clamp quantity to valid range before sending
    const qty = SpaceIS.snapQuantity(productModalState.quantity, { min: minQty, max: maxQty, step });
    productModalState.quantity = qty;
    const qtyEl = document.getElementById("modal-qty-val");
    if (qtyEl) qtyEl.value = String(qty);

    addBtn.disabled = true;
    addBtn.textContent = "Adding...";
    cartMgr
      .add(productModalState.selectedVariantUuid, qty)
      .then(() => {
        showToast("Added to cart!", "success");
        closeModal();
      })
      .catch((err) => {
        showToast(getErrorMessage(err), "error");
        addBtn.disabled = false;
        addBtn.textContent = "Add to cart";
      });
  });
}

function getSelectedVariant(product) {
  if (!product.variants) return null;
  return (
    product.variants.find((v) => v.uuid === productModalState.selectedVariantUuid) || null
  );
}

function updateModalPrice(product) {
  const variant = getSelectedVariant(product);
  if (!variant) return;
  const priceEl = document.getElementById("modal-price");
  if (priceEl) priceEl.textContent = fp(variant.price);

  // Update old price
  const oldPriceEl = document.getElementById("modal-price-old");
  if (oldPriceEl) {
    if (variant.base_price && variant.base_price !== variant.price) {
      oldPriceEl.textContent = fp(variant.base_price);
      oldPriceEl.style.display = "";
    } else {
      oldPriceEl.textContent = "";
      oldPriceEl.style.display = "none";
    }
  }

  // Update lowest price in 30 days
  const lowestEl = document.getElementById("modal-price-lowest");
  if (lowestEl) {
    if (variant.lowest_price_last_30_days) {
      lowestEl.textContent = `Lowest in 30 days: ${fp(variant.lowest_price_last_30_days)}`;
      lowestEl.style.display = "";
    } else {
      lowestEl.textContent = "";
      lowestEl.style.display = "none";
    }
  }
}

async function loadProductRecommendations(slugOrUuid) {
  const container = document.getElementById("modal-recommendations");
  if (!container) return;

  try {
    const recs = await client.products.recommendations(slugOrUuid);
    if (!recs?.length) return;
    container.innerHTML = renderRecsHtml(recs, "Recommended");
    attachRecsClickHandler(container, recs);
  } catch {
    // Recommendations failed — silently ignore
  }
}

function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = cartOpen ? "hidden" : "";
}

// ══════════════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════════════════

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modalOverlay = document.getElementById("modal-overlay");
    if (modalOverlay?.classList.contains("open")) {
      closeModal();
      return;
    }
    if (cartOpen) {
      toggleCart();
    }
  }
});

// ══════════════════════════════════════════════════════════
//  COMMUNITY SECTION (top customers, latest orders, goals)
// ══════════════════════════════════════════════════════════

function renderCommunitySection() {
  const mainEl = document.querySelector("main .container");
  if (!mainEl) return;

  const section = document.createElement("section");
  section.className = "section community-section";
  section.innerHTML =
    '<div class="community-grid">' +
      '<div class="community-card">' +
        '<div class="community-card-header">Top customers</div>' +
        '<div class="community-card-body" id="top-customers"><div class="spinner"></div></div>' +
      '</div>' +
      '<div class="community-card">' +
        '<div class="community-card-header">Latest orders</div>' +
        '<div class="community-card-body" id="latest-orders"><div class="spinner"></div></div>' +
      '</div>' +
    '</div>' +
    '<div class="community-card">' +
      '<div class="community-card-header">Community goals</div>' +
      '<div class="community-card-body" id="goals"><div class="spinner"></div></div>' +
    '</div>';
  mainEl.appendChild(section);
}

function loadCommunityData() {
  // Top customers
  client.rankings
    .top({ limit: 10, sort: "-total_spent" })
    .then((customers) => {
      const el = document.getElementById("top-customers");
      if (!customers || customers.length === 0) {
        el.innerHTML = '<div class="community-empty">No data yet.</div>';
        return;
      }
      let html = "";
      customers.forEach((c, i) => {
        html +=
          '<div class="rank-row">' +
          `<span class="rank-pos">#${i + 1}</span>` +
          `<span class="rank-name">${esc(c.first_name)}</span>` +
          `<span class="rank-value">${fp(c.total_spent)}</span>` +
          '</div>';
      });
      el.innerHTML = html;
    })
    .catch(() => {
      document.getElementById("top-customers").innerHTML =
        '<div class="community-empty">Failed to load.</div>';
    });

  // Latest orders
  client.rankings
    .latest({ limit: 10, sort: "-completed_at" })
    .then((orders) => {
      const el = document.getElementById("latest-orders");
      if (!orders || orders.length === 0) {
        el.innerHTML = '<div class="community-empty">No orders yet.</div>';
        return;
      }
      let html = "";
      orders.forEach((o) => {
        const date = new Date(o.completed_at);
        const timeAgo = getCommunityTimeAgo(date);
        html +=
          '<div class="latest-row">' +
          `<span class="latest-name">${esc(o.first_name)}</span>` +
          `<span class="latest-time">${esc(timeAgo)}</span>` +
          '</div>';
      });
      el.innerHTML = html;
    })
    .catch(() => {
      document.getElementById("latest-orders").innerHTML =
        '<div class="community-empty">Failed to load.</div>';
    });

  // Goals
  client.goals
    .list({ per_page: 10 })
    .then((result) => {
      const el = document.getElementById("goals");
      const goals = result.data || [];
      if (goals.length === 0) {
        el.innerHTML = '<div class="community-empty">No active goals.</div>';
        return;
      }
      let html = "";
      goals.forEach((g) => {
        const progress = Math.min(g.progress, 100);
        const target = g.target ? fp(g.target) : "\u2014";
        html +=
          '<div class="goal-item">' +
          '<div class="goal-header">' +
          `<span class="goal-name">${esc(g.name)}</span>` +
          `<span class="goal-progress-text">${progress}%</span>` +
          '</div>' +
          `<div class="goal-bar"><div class="goal-bar-fill" style="width:${progress}%"></div></div>` +
          '<div class="goal-amounts">' +
          `<span>${fp(g.collected)}</span>` +
          `<span>${target}</span>` +
          '</div>' +
          '</div>';
      });
      el.innerHTML = html;
    })
    .catch(() => {
      document.getElementById("goals").innerHTML =
        '<div class="community-empty">Failed to load.</div>';
    });
}

function getCommunityTimeAgo(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en");
}

// ══════════════════════════════════════════════════════════
//  INIT (runs on every page)
// ══════════════════════════════════════════════════════════

(() => {
  const path = window.location.pathname;
  const filename = path.substring(path.lastIndexOf("/") + 1).replace(".html", "") || "index";
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
  renderCartDrawer();

  // Render community section on shop pages (products, packages, sales)
  if (SHOP_KEYS.includes(pageKey)) {
    renderCommunitySection();
    loadCommunityData();
  }

  cartMgr.load().catch(() => {});
})();