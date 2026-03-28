"use strict";

// ══════════════════════════════════════════════════════════
//  CONFIGURATION
// ══════════════════════════════════════════════════════════

/**
 * Shop configuration — replace with your own values.
 * Get shopUuid from SpaceIS panel.
 */
var SHOP_CONFIG = {
  baseUrl: "https://storefront-api.spaceis.app",
  shopUuid: "xxx",
  lang: "pl",
};

// ══════════════════════════════════════════════════════════
//  SDK INIT
//  Creates API client and reactive cart manager.
//  Cart token is auto-generated and persisted in localStorage.
// ══════════════════════════════════════════════════════════

var client = SpaceIS.createSpaceIS(SHOP_CONFIG);
var cartMgr = client.createCartManager();

// ══════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════

var cartOpen = false;

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
      var all = err.allFieldErrors ? err.allFieldErrors() : [];
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
  container.querySelectorAll("script, style, iframe, object, embed, form").forEach(function (el) {
    el.remove();
  });
  container.querySelectorAll("*").forEach(function (el) {
    var attrs = el.attributes;
    for (var i = attrs.length - 1; i >= 0; i--) {
      var name = attrs[i].name.toLowerCase();
      if (name.indexOf("on") === 0) {
        el.removeAttribute(attrs[i].name);
      }
    }
    if (el.hasAttribute("href")) {
      var href = (el.getAttribute("href") || "").trim().toLowerCase();
      if (href.indexOf("javascript:") === 0) {
        el.removeAttribute("href");
      }
    }
    if (el.hasAttribute("src")) {
      var src = (el.getAttribute("src") || "").trim().toLowerCase();
      if (src.indexOf("javascript:") === 0) {
        el.removeAttribute("src");
      }
    }
  });
}

// ══════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════

function showToast(message, type) {
  var container = document.getElementById("toast-container");
  if (!container) return;
  var toast = document.createElement("div");
  toast.className = "toast";
  if (type === "error") toast.className += " error";
  if (type === "success") toast.className += " success";
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      toast.classList.add("show");
    });
  });

  setTimeout(function () {
    toast.classList.remove("show");
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}

// ══════════════════════════════════════════════════════════
//  SKELETON LOADERS
// ══════════════════════════════════════════════════════════

function renderSkeletons(containerId, count) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var grid = document.createElement("div");
  grid.className = "products-grid";
  for (var i = 0; i < (count || 8); i++) {
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
var SHOP_TABS = [
  { href: "index.html", label: "Products", key: "products" },
  { href: "packages.html", label: "Packages", key: "packages" },
  { href: "sales.html", label: "Sales", key: "sales" },
];
var SHOP_KEYS = SHOP_TABS.map(function (t) { return t.key; });

function renderHeader(activePage) {
  var headerEl = document.getElementById("site-header");
  if (!headerEl) return;

  var shopActive = SHOP_KEYS.indexOf(activePage) !== -1;

  var navLinksHtml =
    '<li><a href="index.html"' + (shopActive ? ' class="active"' : '') + '>Shop</a></li>' +
    '<li><a href="voucher.html"' + (activePage === 'voucher' ? ' class="active"' : '') + '>Voucher</a></li>' +
    '<li><a href="daily-reward.html"' + (activePage === 'daily-reward' ? ' class="active"' : '') + '>Daily Reward</a></li>' +
    '<li><a href="page.html"' + (activePage === 'pages' ? ' class="active"' : '') + '>Pages</a></li>' +
    '<li><a href="statute.html"' + (activePage === 'statute' ? ' class="active"' : '') + '>Terms</a></li>';

  headerEl.innerHTML =
    '<div class="container">' +
      '<div class="header-inner">' +
        '<a href="index.html" class="nav-logo">SpaceIS</a>' +
        '<ul class="nav-links">' + navLinksHtml + '</ul>' +
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
  var overlay = document.createElement('div');
  overlay.className = 'mobile-menu-overlay';
  overlay.id = 'mobile-menu-overlay';
  document.body.appendChild(overlay);

  var mobileNav = document.createElement('nav');
  mobileNav.className = 'mobile-menu';
  mobileNav.id = 'mobile-menu';
  mobileNav.innerHTML = '<ul class="mobile-menu-links">' + navLinksHtml + '</ul>';
  document.body.appendChild(mobileNav);

  // Sub-tabs for shop pages
  if (shopActive) {
    var tabsHtml = SHOP_TABS.map(function (tab) {
      var isActive = tab.key === activePage;
      return '<a href="' + tab.href + '" class="sub-tab' + (isActive ? ' active' : '') + '">' + tab.label + '</a>';
    }).join('');

    var subBar = document.createElement('div');
    subBar.className = 'sub-tabs-bar';
    subBar.innerHTML = '<div class="container"><div class="sub-tabs">' + tabsHtml + '</div></div>';
    headerEl.appendChild(subBar);
  }

  document.getElementById("cart-btn-header").addEventListener("click", function () {
    toggleCart();
  });

  // Mobile menu toggle
  var mobileMenuBtn = document.getElementById("mobile-menu-btn");
  var mobileMenu = document.getElementById("mobile-menu");
  var mobileOverlay = document.getElementById("mobile-menu-overlay");

  function openMobileMenu() {
    mobileMenuBtn.classList.add("active");
    mobileMenu.classList.add("open");
    mobileOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeMobileMenu() {
    mobileMenuBtn.classList.remove("active");
    mobileMenu.classList.remove("open");
    mobileOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  mobileMenuBtn.addEventListener("click", function () {
    if (mobileMenu.classList.contains("open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  mobileOverlay.addEventListener("click", function () {
    closeMobileMenu();
  });

  // Close mobile menu when a link is clicked
  mobileMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      closeMobileMenu();
    });
  });
}

function renderFooter() {
  var footerEl = document.getElementById("site-footer");
  if (!footerEl) return;
  footerEl.className = "site-footer";
  footerEl.innerHTML =
    '<div class="container">' +
      '<span class="footer-text">Powered by <strong>SpaceIS SDK</strong> v0.1.0</span>' +
    '</div>';
}

// ══════════════════════════════════════════════════════════
//  SHARED UI HELPERS
//  Reusable constants and functions used across all pages.
// ══════════════════════════════════════════════════════════

// SVG placeholder images at three sizes — avoids repeating inline SVG
var PLACEHOLDER_SVG_SM = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
var PLACEHOLDER_SVG_MD = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
var PLACEHOLDER_SVG_LG = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';

// Product limits cache shared across all pages (cart drawer, cart page, checkout)
var _limitsCache = {};

/**
 * Fetch quantity limits (min/max/step) for a cart variant.
 * Results are cached so the product API is called at most once per variant.
 */
function getVariantLimits(variantUuid) {
  if (_limitsCache[variantUuid]) return Promise.resolve(_limitsCache[variantUuid]);
  var item = cartMgr.items.find(function (i) {
    return i.variant && i.variant.uuid === variantUuid;
  });
  if (!item || !item.shop_product) return Promise.resolve({ min: 1, max: 99, step: 1 });
  return client.products
    .get(item.shop_product.uuid)
    .then(function (product) {
      var limits = SpaceIS.getProductLimits(product);
      _limitsCache[variantUuid] = limits;
      return limits;
    })
    .catch(function () {
      return { min: 1, max: 99, step: 1 };
    });
}

/**
 * Shared click handler for qty steppers (+/−) and remove buttons.
 * Works with both data-uuid (drawer/cart page) and data-variant (checkout).
 * Returns true when a matching action was handled, false otherwise.
 */
function handleQtyStepperClick(e) {
  var btn = e.target.closest("[data-action]");
  if (!btn || btn.disabled) return false;
  var action = btn.dataset.action;

  // "remove" action — explicit remove button
  if (action === "remove") {
    var ruuid = btn.dataset.uuid;
    if (ruuid) {
      btn.disabled = true;
      cartMgr.remove(ruuid)
        .catch(function (err) { showToast(getErrorMessage(err), "error"); })
        .finally(function () { btn.disabled = false; });
    }
    return true;
  }

  // +/− stepper (supports both plus/minus and inc/dec naming conventions)
  var isPlus = action === "plus" || action === "inc";
  var isMinus = action === "minus" || action === "dec";
  if (!isPlus && !isMinus) return false;

  // UUID comes from data-uuid on the button, or data-variant on the parent .qty-stepper
  var stepper = btn.closest(".qty-stepper");
  var uuid = btn.dataset.uuid || (stepper && stepper.dataset.variant) || "";
  if (!uuid) return false;

  btn.disabled = true;
  var currentQty = cartMgr.getQuantity(uuid);

  getVariantLimits(uuid).then(function (limits) {
    var newQty;
    if (isPlus) {
      newQty = currentQty + limits.step;
      if (newQty > limits.max) {
        showToast("Maximum " + limits.max + " items", "error");
        btn.disabled = false;
        return;
      }
    } else {
      newQty = currentQty - limits.step;
      if (newQty < limits.min) {
        return cartMgr.remove(uuid)
          .catch(function (err) { showToast(getErrorMessage(err), "error"); })
          .finally(function () { btn.disabled = false; });
      }
    }
    return cartMgr.setQuantity(uuid, newQty)
      .catch(function (err) {
        showToast(getErrorMessage(err), "error");
        cartMgr.load().catch(function () {});
      })
      .finally(function () { btn.disabled = false; });
  });
  return true;
}

/**
 * Shared change handler for qty text inputs.
 * Looks for UUID via data-uuid or parent .qty-stepper[data-variant].
 * Validates against product limits (min/max/step) before updating.
 */
function handleQtyInputChange(e) {
  if (!e.target.classList.contains("qty-input")) return;
  var input = e.target;
  var stepper = input.closest(".qty-stepper");
  var uuid = input.dataset.uuid || (stepper && stepper.dataset.variant) || "";
  if (!uuid) return;
  var rawQty = parseInt(input.value, 10);
  if (isNaN(rawQty) || rawQty < 1) {
    input.value = cartMgr.getQuantity(uuid) || 1;
    return;
  }
  input.disabled = true;
  getVariantLimits(uuid).then(function (limits) {
    var newQty = rawQty;
    if (newQty < limits.min) newQty = limits.min;
    if (newQty > limits.max) newQty = limits.max;
    if (limits.step > 1) newQty = Math.round((newQty - limits.min) / limits.step) * limits.step + limits.min;

    if (newQty < limits.min) {
      return cartMgr.remove(uuid)
        .catch(function (err) { showToast(getErrorMessage(err), "error"); })
        .finally(function () { input.disabled = false; });
    }

    input.value = newQty;
    return cartMgr.setQuantity(uuid, newQty)
      .catch(function (err) {
        showToast(getErrorMessage(err), "error");
        input.value = cartMgr.getQuantity(uuid) || 1;
      })
      .finally(function () { input.disabled = false; });
  });
}

/**
 * Render the discount code section (apply form or active badge) into containerEl.
 * @param {Element} containerEl  Target element whose innerHTML will be replaced.
 * @param {Object}  [opts]       Optional ID overrides: inputId, applyId, removeId.
 */
function renderDiscountSection(containerEl, opts) {
  opts = opts || {};
  var inputId = opts.inputId || "shared-discount-input";
  var applyId = opts.applyId || "shared-discount-apply";
  var removeId = opts.removeId || "shared-discount-remove";

  if (cartMgr.hasDiscount) {
    containerEl.innerHTML =
      '<div class="discount-active">' +
        '<span>Code: <strong>' + esc(cartMgr.discount.code) + '</strong></span>' +
        '<span class="discount-active-pct">-' + cartMgr.discount.percentage_discount + '%</span>' +
        '<button class="discount-remove" id="' + removeId + '">Remove</button>' +
      '</div>';
    document.getElementById(removeId).addEventListener("click", function () {
      removeDiscountCode();
    });
  } else {
    containerEl.innerHTML =
      '<div class="discount-row">' +
        '<input type="text" placeholder="Discount code" id="' + inputId + '" autocomplete="off">' +
        '<button class="discount-apply" id="' + applyId + '">Apply</button>' +
      '</div>';
    document.getElementById(applyId).addEventListener("click", function () {
      var code = document.getElementById(inputId).value.trim();
      if (!code) return;
      cartMgr.applyDiscount(code)
        .then(function () { showToast("Discount applied!", "success"); })
        .catch(function (e) { showToast(getErrorMessage(e) || "Invalid code", "error"); });
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
  var itemCount = cartMgr.totalQuantity;
  var html = '';
  html += '<div class="cart-summary-header">' + (opts.header || 'Subtotal') + ' (' + itemCount + ')</div>';
  html += '<div class="cart-summary-row"><span>' + (opts.subtotalLabel || 'Subtotal') + '</span><span>' + fp(cartMgr.regularPrice) + '</span></div>';

  var discountAmount = cartMgr.regularPrice - cartMgr.finalPrice;
  if (discountAmount > 0) {
    var discountLabel = cartMgr.hasDiscount && cartMgr.discount
      ? 'Discount (' + cartMgr.discount.percentage_discount + '%)'
      : 'Discount';
    html += '<div class="cart-summary-row cart-summary-discount"><span>' + discountLabel + '</span><span>-' + fp(discountAmount) + '</span></div>';
  }

  html += '<div class="cart-summary-total"><span>' + (opts.totalLabel || 'Total') + '</span><span>' + fp(cartMgr.finalPrice) + '</span></div>';
  containerEl.innerHTML = html;
}

// ══════════════════════════════════════════════════════════
//  CART DRAWER
// ══════════════════════════════════════════════════════════

function renderCartDrawer() {
  var drawerEl = document.getElementById("site-cart-drawer");
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
  var tpl = document.createElement('template');
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

  document.getElementById("overlay").addEventListener("click", function () {
    toggleCart();
  });
  document.getElementById("drawer-close-btn").addEventListener("click", function () {
    toggleCart();
  });

  document.getElementById("go-checkout-btn").addEventListener("click", function () {
    toggleCart();
    window.location.href = "checkout.html";
  });
  document.getElementById("go-cart-btn").addEventListener("click", function () {
    toggleCart();
    window.location.href = "cart.html";
  });

  // Event delegation on drawer element (set ONCE, survives innerHTML re-renders)
  var drawerBody = document.getElementById("drawer");
  if (!drawerBody) return;

  drawerBody.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.id === "discount-input") {
      applyDiscountCode();
    }
    if (e.key === "Enter" && e.target.classList.contains("qty-input")) {
      e.preventDefault();
      e.target.blur();
    }
  });

  // Delegate qty stepper clicks and input changes to shared handlers
  drawerBody.addEventListener("click", function (e) {
    handleQtyStepperClick(e);
  });

  drawerBody.addEventListener("change", function (e) {
    handleQtyInputChange(e);
  });
}

function toggleCart() {
  cartOpen = !cartOpen;
  var overlay = document.getElementById("overlay");
  var drawer = document.getElementById("drawer");
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

cartMgr.onChange(function () {
  renderCartBadge();
  renderCartItems();
});

function renderCartBadge() {
  var badge = document.getElementById("cart-badge");
  if (!badge) return;
  var count = cartMgr.totalQuantity;
  if (count > 0) {
    var prev = badge.textContent;
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
  var itemsEl = document.getElementById("cart-items");
  var footerEl = document.getElementById("cart-footer");
  var titleEl = document.getElementById("drawer-title");
  if (!itemsEl) return;

  // Update header count
  var totalQty = cartMgr.totalQuantity;
  if (titleEl) titleEl.textContent = "CART" + (totalQty > 0 ? " (" + totalQty + ")" : "");

  if (cartMgr.isLoading) {
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

  // Render items using <template>
  var tpl = document.getElementById("cart-item-tpl");
  var list = document.createElement("ul");
  list.className = "cart-items-list";

  cartMgr.items.forEach(function (item) {
    var clone = tpl.content.cloneNode(true);
    var li = clone.querySelector(".cart-item");
    var imgWrap = clone.querySelector(".cart-item-img-wrap");
    var nameEl = clone.querySelector(".cart-item-name");
    var variantEl = clone.querySelector(".cart-item-variant");
    var packageEl = clone.querySelector(".cart-item-package");
    var removeBtn = clone.querySelector(".cart-item-remove");
    var pricesEl = clone.querySelector(".cart-item-prices");
    var qtyEl = clone.querySelector(".cart-item-qty");

    var variantUuid = item.variant ? item.variant.uuid : "";
    var imgSrc = SpaceIS.getCartItemImage(item);
    var displayQty = SpaceIS.getItemQty(item);
    var showVariant = item.variant && item.shop_product && item.variant.name !== item.shop_product.name;

    // Image
    if (imgSrc) {
      imgWrap.innerHTML = '<img class="cart-item-img" src="' + esc(imgSrc) + '" alt="">';
    } else {
      imgWrap.innerHTML = '<div class="cart-item-img-placeholder">' + PLACEHOLDER_SVG_SM + '</div>';
    }

    // Name
    nameEl.textContent = item.shop_product ? item.shop_product.name : "";

    // Variant (hide if same as product name)
    if (showVariant) {
      variantEl.textContent = item.variant.name;
    } else {
      variantEl.style.display = "none";
    }

    // Package info
    if (item.package) {
      packageEl.textContent = "Package: " + item.package.name;
      packageEl.style.display = "";
    } else {
      packageEl.style.display = "none";
    }

    // Remove button
    removeBtn.dataset.uuid = variantUuid;

    // Prices
    var priceHtml = '<span class="cart-item-price-current">' + fp(item.final_price_value) + '</span>';
    if (item.regular_price_value !== item.final_price_value) {
      priceHtml += ' <span class="cart-item-price-old">' + fp(item.regular_price_value) + '</span>';
    }
    pricesEl.innerHTML = priceHtml;

    // Quantity stepper
    qtyEl.innerHTML =
      '<div class="qty-stepper">' +
        '<button class="qty-step-btn" data-action="minus" data-uuid="' + esc(variantUuid) + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>' +
        '<input class="qty-input" type="number" min="1" value="' + displayQty + '" data-uuid="' + esc(variantUuid) + '">' +
        '<button class="qty-step-btn" data-action="plus" data-uuid="' + esc(variantUuid) + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>' +
      '</div>';

    list.appendChild(clone);
  });

  itemsEl.innerHTML = "";
  itemsEl.appendChild(list);

  // ── Discount section ──
  var discountEl = document.getElementById("discount-section");
  if (discountEl) {
    renderDiscountSection(discountEl, {
      inputId: "discount-input",
      applyId: "discount-apply-btn",
      removeId: "discount-remove-btn",
    });
  }

  // ── Summary panel (matches multi-tenant CartSummary) ──
  var totalsEl = document.getElementById("cart-totals");
  if (totalsEl) {
    renderCartSummary(totalsEl);
  }
}

// ══════════════════════════════════════════════════════════
//  SHARED RECOMMENDATION RENDERING
//  Used by product modal, cart drawer, and checkout.
// ══════════════════════════════════════════════════════════

function renderRecsHtml(recs, title) {
  var html = '<div class="recs-section">';
  html += '<div class="recs-section-title">' + esc(title || "Recommended") + "</div>";
  html += '<div class="recs-grid">';
  (recs || []).forEach(function (rec) {
    var minQty =
      rec.shop_product && rec.shop_product.min_quantity
        ? SpaceIS.fromApiQty(rec.shop_product.min_quantity)
        : 1;
    var imgSrc =
      (rec.variant && rec.variant.image) || (rec.shop_product && rec.shop_product.image) || null;
    var imgHtml = imgSrc
      ? '<img class="rec-img" src="' + esc(imgSrc) + '" alt="">'
      : '<div class="rec-img-placeholder">' + PLACEHOLDER_SVG_SM + '</div>';

    html +=
      '<div class="rec-card" data-variant-uuid="' +
      esc(rec.variant ? rec.variant.uuid : "") +
      '">' +
      imgHtml +
      '<div class="rec-info">' +
      '<div class="rec-name">' +
      esc(rec.name || (rec.shop_product ? rec.shop_product.name : "")) +
      "</div>" +
      '<div class="rec-price-row">' +
      '<span class="rec-price">' +
      fp(rec.price * minQty) +
      "</span>" +
      (rec.base_price !== rec.price
        ? '<span class="rec-old-price">' + fp(rec.base_price * minQty) + "</span>"
        : "") +
      (minQty > 1 ? '<span class="rec-qty-label">(' + minQty + " pcs.)</span>" : "") +
      "</div>" +
      "</div>" +
      '<button class="rec-add-btn" title="Add to cart" aria-label="Add to cart">+</button>' +
      "</div>";
  });
  html += "</div></div>";
  return html;
}

function attachRecsClickHandler(container, recs) {
  container.addEventListener("click", function (e) {
    var btn = e.target.closest(".rec-add-btn");
    if (!btn) return;
    var card = btn.closest(".rec-card");
    var variantUuid = card ? card.dataset.variantUuid : null;
    if (!variantUuid) return;

    var minQty = 1;
    (recs || []).forEach(function (r) {
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
      .then(function () {
        showToast("Added to cart!", "success");
        btn.textContent = "\u2713";
        setTimeout(function () {
          btn.textContent = "+";
          btn.disabled = false;
        }, 1500);
      })
      .catch(function (err) {
        showToast(getErrorMessage(err), "error");
        btn.textContent = "+";
        btn.disabled = false;
      });
  });
}

function loadCartRecommendations() {
  var container = document.getElementById("cart-recommendations");
  if (!container) {
    // Create container in drawer body if it doesn't exist
    var body = document.getElementById("cart-items");
    if (!body) return;
    var div = document.createElement("div");
    div.id = "cart-recommendations";
    div.className = "cart-recs";
    body.parentNode.insertBefore(div, document.getElementById("cart-footer"));
    container = div;
  }

  if (cartMgr.isEmpty) {
    container.innerHTML = "";
    return;
  }

  var firstItem = cartMgr.items[0];
  if (!firstItem || !firstItem.shop_product) {
    container.innerHTML = "";
    return;
  }

  client.products
    .recommendations(firstItem.shop_product.uuid)
    .then(function (recs) {
      if (!recs || recs.length === 0) {
        container.innerHTML = "";
        return;
      }
      var sliced = recs.slice(0, 4);
      container.innerHTML = renderRecsHtml(sliced, "You might also like");
      attachRecsClickHandler(container, sliced);
    })
    .catch(function () {
      container.innerHTML = "";
    });
}

function applyDiscountCode() {
  var input = document.getElementById("discount-input");
  if (!input) return;
  var code = input.value.trim();
  if (!code) {
    showToast("Enter discount code", "error");
    return;
  }

  var btn = document.getElementById("discount-apply-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "...";
  }

  cartMgr
    .applyDiscount(code)
    .then(function () {
      showToast("Discount applied!", "success");
    })
    .catch(function (err) {
      showToast(getErrorMessage(err) || "Invalid code", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Apply";
      }
    });
}

function removeDiscountCode() {
  cartMgr.removeDiscount().catch(function (err) {
    showToast(getErrorMessage(err), "error");
  });
}

// ══════════════════════════════════════════════════════════
//  PRODUCT DETAIL MODAL (shared — used by index & packages)
// ══════════════════════════════════════════════════════════

var productModalState = {
  product: null,
  selectedVariantUuid: null,
  quantity: 1,
};

function renderModalShell() {
  var existing = document.getElementById("modal-overlay");
  if (existing) return;
  var div = document.createElement("div");
  div.innerHTML =
    '<div class="modal-overlay" id="modal-overlay">' +
    '<div class="modal" id="product-modal" role="dialog" aria-modal="true">' +
    '<button class="modal-close" id="modal-close-btn" aria-label="Close">&#10005;</button>' +
    '<div id="modal-content"></div>' +
    "</div>" +
    "</div>";
  document.body.appendChild(div.firstChild);

  document.getElementById("modal-close-btn").addEventListener("click", function () {
    closeModal();
  });
  document.getElementById("modal-overlay").addEventListener("click", function (e) {
    if (e.target === document.getElementById("modal-overlay")) closeModal();
  });
}

function openProductModal(slug) {
  renderModalShell();
  var overlay = document.getElementById("modal-overlay");
  var content = document.getElementById("modal-content");

  content.innerHTML = '<div style="padding:40px"><div class="spinner"></div></div>';
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";

  client.products
    .get(slug)
    .then(function (product) {
      productModalState.product = product;
      var firstVariant =
        product.variants && product.variants.length > 0 ? product.variants[0] : null;
      productModalState.selectedVariantUuid = firstVariant ? firstVariant.uuid : null;
      var limits = SpaceIS.getProductLimits(product);
      productModalState.quantity = limits.min;
      renderModalContent(product);
    })
    .catch(function () {
      content.innerHTML =
        '<div class="modal-body">' +
        '<div class="empty-state"><p style="color:var(--red)">Failed to load product.</p></div>' +
        "</div>";
    });
}

function renderModalContent(product) {
  var content = document.getElementById("modal-content");

  var imgHtml = product.image
    ? '<img class="modal-img" src="' + esc(product.image) + '" alt="' + esc(product.name) + '">'
    : '<div class="modal-img-placeholder">' + PLACEHOLDER_SVG_SM + '</div>';

  var descHtml = "";
  if (product.description) {
    var temp = document.createElement("div");
    temp.innerHTML = product.description;
    sanitizeHtml(temp);
    descHtml = '<div class="modal-desc">' + temp.innerHTML + "</div>";
  }

  var selectedVariant = getSelectedVariant(product);
  var currentPrice = selectedVariant
    ? selectedVariant.price
    : product.variants && product.variants[0]
      ? product.variants[0].price
      : product.base_price;
  var basePrice = selectedVariant ? selectedVariant.base_price : null;

  var variantsHtml = "";
  if (product.variants && product.variants.length > 0) {
    variantsHtml =
      '<div class="modal-label">Choose variant</div><div class="variants-grid" id="modal-variants">';
    product.variants.forEach(function (v) {
      var isActive = v.uuid === productModalState.selectedVariantUuid ? " active" : "";
      variantsHtml +=
        '<button class="variant-btn' +
        isActive +
        '" data-uuid="' +
        esc(v.uuid) +
        '">' +
        esc(v.name) +
        "</button>";
    });
    variantsHtml += "</div>";
  }

  var limits = SpaceIS.getProductLimits(product);
  var minQty = limits.min;
  var maxQty = limits.max;
  var step = limits.step;
  var showQtySelector = !(minQty === 1 && maxQty === 1 && step === 1);
  var qty = Math.max(productModalState.quantity, minQty);
  productModalState.quantity = qty;

  var oldPriceHtml =
    basePrice && basePrice !== currentPrice
      ? '<div class="modal-price-old" id="modal-price-old">' + fp(basePrice) + "</div>"
      : '<div class="modal-price-old" id="modal-price-old" style="display:none"></div>';

  var lowestHtml = "";
  if (selectedVariant && selectedVariant.lowest_price_last_30_days) {
    lowestHtml =
      '<div class="modal-price-note" id="modal-price-lowest">Lowest in 30 days: ' +
      fp(selectedVariant.lowest_price_last_30_days) +
      "</div>";
  } else {
    lowestHtml = '<div class="modal-price-note" id="modal-price-lowest" style="display:none"></div>';
  }

  content.innerHTML =
    imgHtml +
    '<div class="modal-body">' +
    '<div class="modal-title">' +
    esc(product.name) +
    "</div>" +
    descHtml +
    variantsHtml +
    '<div class="modal-qty-row">' +
    (showQtySelector
      ? "<div>" +
        '<div class="modal-label" style="margin-bottom:6px">Quantity</div>' +
        '<div class="qty-stepper">' +
        '<button class="qty-step-btn" id="modal-qty-minus" aria-label="Decrease"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>' +
        '<input class="qty-step-input" id="modal-qty-val" type="number" min="' +
        minQty +
        '" max="' +
        maxQty +
        '" step="' +
        step +
        '" value="' +
        qty +
        '">' +
        '<button class="qty-step-btn" id="modal-qty-plus" aria-label="Increase"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>' +
        "</div>" +
        "</div>"
      : "") +
    '<div class="modal-price-block">' +
    '<div class="modal-price" id="modal-price">' +
    fp(currentPrice) +
    "</div>" +
    oldPriceHtml +
    lowestHtml +
    "</div>" +
    "</div>" +
    '<button class="modal-add-btn" id="modal-add-btn">Add to cart</button>' +
    '<div id="modal-recommendations" class="modal-recommendations"></div>' +
    "</div>";

  loadProductRecommendations(product.slug);

  var variantsEl = document.getElementById("modal-variants");
  if (variantsEl) {
    variantsEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".variant-btn");
      if (!btn) return;
      productModalState.selectedVariantUuid = btn.dataset.uuid;
      variantsEl.querySelectorAll(".variant-btn").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      updateModalPrice(product);
    });
  }

  // Qty stepper (only if selector is shown)
  if (showQtySelector) {
    var qtyMinus = document.getElementById("modal-qty-minus");
    var qtyPlus = document.getElementById("modal-qty-plus");
    var qtyInput = document.getElementById("modal-qty-val");

    qtyMinus.addEventListener("click", function () {
      var newQty = productModalState.quantity - step;
      if (newQty < minQty) return;
      productModalState.quantity = newQty;
      qtyInput.value = String(newQty);
      qtyMinus.disabled = newQty <= minQty;
      qtyPlus.disabled = false;
    });
    qtyPlus.addEventListener("click", function () {
      var newQty = productModalState.quantity + step;
      if (newQty > maxQty) return;
      productModalState.quantity = newQty;
      qtyInput.value = String(newQty);
      qtyPlus.disabled = newQty >= maxQty;
      qtyMinus.disabled = false;
    });
    qtyMinus.disabled = qty <= minQty;
    qtyPlus.disabled = qty >= maxQty;

    // Manual input — snap to valid value on blur/change
    qtyInput.addEventListener("change", function () {
      var val = parseInt(qtyInput.value, 10);
      if (isNaN(val) || val < minQty) val = minQty;
      if (val > maxQty) val = maxQty;
      if (step > 1) val = Math.round((val - minQty) / step) * step + minQty;
      qtyInput.value = val;
      productModalState.quantity = val;
      qtyMinus.disabled = val <= minQty;
      qtyPlus.disabled = val >= maxQty;
    });
    qtyInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        qtyInput.blur();
      }
    });
  }

  var addBtn = document.getElementById("modal-add-btn");
  addBtn.addEventListener("click", function () {
    if (!productModalState.selectedVariantUuid) {
      showToast("Choose variant", "error");
      return;
    }
    // Clamp quantity to valid range before sending
    var qty = productModalState.quantity;
    if (qty < minQty) qty = minQty;
    if (qty > maxQty) qty = maxQty;
    if (step > 1) qty = Math.round((qty - minQty) / step) * step + minQty;
    productModalState.quantity = qty;
    var qtyEl = document.getElementById("modal-qty-val");
    if (qtyEl) qtyEl.value = String(qty);

    addBtn.disabled = true;
    addBtn.textContent = "Adding...";
    cartMgr
      .add(productModalState.selectedVariantUuid, qty)
      .then(function () {
        showToast("Added to cart!", "success");
        closeModal();
      })
      .catch(function (err) {
        showToast(getErrorMessage(err), "error");
        addBtn.disabled = false;
        addBtn.textContent = "Add to cart";
      });
  });
}

function getSelectedVariant(product) {
  if (!product.variants) return null;
  return (
    product.variants.find(function (v) {
      return v.uuid === productModalState.selectedVariantUuid;
    }) || null
  );
}

function updateModalPrice(product) {
  var variant = getSelectedVariant(product);
  if (!variant) return;
  var priceEl = document.getElementById("modal-price");
  if (priceEl) priceEl.textContent = fp(variant.price);

  // Update old price
  var oldPriceEl = document.getElementById("modal-price-old");
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
  var lowestEl = document.getElementById("modal-price-lowest");
  if (lowestEl) {
    if (variant.lowest_price_last_30_days) {
      lowestEl.textContent = "Lowest in 30 days: " + fp(variant.lowest_price_last_30_days);
      lowestEl.style.display = "";
    } else {
      lowestEl.textContent = "";
      lowestEl.style.display = "none";
    }
  }
}

function loadProductRecommendations(slugOrUuid) {
  var container = document.getElementById("modal-recommendations");
  if (!container) return;

  client.products
    .recommendations(slugOrUuid)
    .then(function (recs) {
      if (!recs || recs.length === 0) return;

      container.innerHTML = renderRecsHtml(recs, "Recommended");
      attachRecsClickHandler(container, recs);
    })
    .catch(function () {
      // Recommendations failed — silently ignore
    });
}

function closeModal() {
  var overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = cartOpen ? "hidden" : "";
}

// ══════════════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════════════════

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    var modalOverlay = document.getElementById("modal-overlay");
    if (modalOverlay && modalOverlay.classList.contains("open")) {
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
  var mainEl = document.querySelector("main .container");
  if (!mainEl) return;

  var section = document.createElement("section");
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
    .then(function (customers) {
      var el = document.getElementById("top-customers");
      if (!customers || customers.length === 0) {
        el.innerHTML = '<div class="community-empty">No data yet.</div>';
        return;
      }
      var html = "";
      customers.forEach(function (c, i) {
        html +=
          '<div class="rank-row">' +
          '<span class="rank-pos">#' + (i + 1) + '</span>' +
          '<span class="rank-name">' + esc(c.first_name) + '</span>' +
          '<span class="rank-value">' + fp(c.total_spent) + '</span>' +
          '</div>';
      });
      el.innerHTML = html;
    })
    .catch(function () {
      document.getElementById("top-customers").innerHTML =
        '<div class="community-empty">Failed to load.</div>';
    });

  // Latest orders
  client.rankings
    .latest({ limit: 10, sort: "-completed_at" })
    .then(function (orders) {
      var el = document.getElementById("latest-orders");
      if (!orders || orders.length === 0) {
        el.innerHTML = '<div class="community-empty">No orders yet.</div>';
        return;
      }
      var html = "";
      orders.forEach(function (o) {
        var date = new Date(o.completed_at);
        var timeAgo = getCommunityTimeAgo(date);
        html +=
          '<div class="latest-row">' +
          '<span class="latest-name">' + esc(o.first_name) + '</span>' +
          '<span class="latest-time">' + esc(timeAgo) + '</span>' +
          '</div>';
      });
      el.innerHTML = html;
    })
    .catch(function () {
      document.getElementById("latest-orders").innerHTML =
        '<div class="community-empty">Failed to load.</div>';
    });

  // Goals
  client.goals
    .list({ per_page: 10 })
    .then(function (result) {
      var el = document.getElementById("goals");
      var goals = result.data || [];
      if (goals.length === 0) {
        el.innerHTML = '<div class="community-empty">No active goals.</div>';
        return;
      }
      var html = "";
      goals.forEach(function (g) {
        var progress = Math.min(g.progress, 100);
        var target = g.target ? fp(g.target) : "\u2014";
        html +=
          '<div class="goal-item">' +
          '<div class="goal-header">' +
          '<span class="goal-name">' + esc(g.name) + '</span>' +
          '<span class="goal-progress-text">' + progress + '%</span>' +
          '</div>' +
          '<div class="goal-bar"><div class="goal-bar-fill" style="width:' + progress + '%"></div></div>' +
          '<div class="goal-amounts">' +
          '<span>' + fp(g.collected) + '</span>' +
          '<span>' + target + '</span>' +
          '</div>' +
          '</div>';
      });
      el.innerHTML = html;
    })
    .catch(function () {
      document.getElementById("goals").innerHTML =
        '<div class="community-empty">Failed to load.</div>';
    });
}

function getCommunityTimeAgo(date) {
  var now = Date.now();
  var diff = now - date.getTime();
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  var hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  var days = Math.floor(hours / 24);
  if (days < 30) return days + "d ago";
  return date.toLocaleDateString("en");
}

// ══════════════════════════════════════════════════════════
//  INIT (runs on every page)
// ══════════════════════════════════════════════════════════

(function init() {
  var path = window.location.pathname;
  var filename = path.substring(path.lastIndexOf("/") + 1).replace(".html", "") || "index";
  var PAGE_KEY_MAP = {
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
  var pageKey = PAGE_KEY_MAP[filename] || "products";

  renderHeader(pageKey);
  renderFooter();
  renderCartDrawer();

  // Render community section on shop pages (products, packages, sales)
  if (SHOP_KEYS.indexOf(pageKey) !== -1) {
    renderCommunitySection();
    loadCommunityData();
  }

  cartMgr.load().catch(function () {});
})();
