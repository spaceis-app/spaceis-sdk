// examples/vanilla/shared/cart.js
// Cart drawer UI, cart render, qty steppers, discount section.
// client + cartMgr are imported lazily (used inside functions only — no top-level call)
// to avoid circular dep with main.js.

import { esc, fp, getErrorMessage, PLACEHOLDER_SVG_SM } from "./format.js";
import { showToast } from "./toast.js";

// Resolved at runtime via getter injected from main.js
let _client;
let _cartMgr;
let _cartOpen = false;
// Limits cache shared across cart drawer, cart page, and checkout
const _limitsCache = {};

export function initCart(client, cartMgr) {
  _client = client;
  _cartMgr = cartMgr;

  // Reactive updates: badge + drawer items
  _cartMgr.onChange(() => {
    renderCartBadge();
    renderCartItems();
  });

  renderCartDrawer();
}

// ── Exported state accessors for other modules ────────────────────────────────

export function isCartOpen() {
  return _cartOpen;
}

// ── Variant limits cache ──────────────────────────────────────────────────────

/**
 * Fetch quantity limits (min/max/step) for a cart variant.
 * Results are cached so the product API is called at most once per variant.
 */
export async function getVariantLimits(variantUuid) {
  if (_limitsCache[variantUuid]) return _limitsCache[variantUuid];
  const item = _cartMgr.items.find((i) => i.variant?.uuid === variantUuid);
  if (!item?.shop_product) return { min: 1, max: 99, step: 1 };
  try {
    const product = await _client.products.get(item.shop_product.uuid);
    const limits = window.SpaceIS.getProductLimits(product);
    _limitsCache[variantUuid] = limits;
    return limits;
  } catch {
    return { min: 1, max: 99, step: 1 };
  }
}

// ── Qty stepper shared handlers ───────────────────────────────────────────────

/**
 * Shared click handler for qty steppers (+/−) and remove buttons.
 * Works with both data-uuid (drawer/cart page) and data-variant (checkout).
 * Returns true when a matching action was handled, false otherwise.
 */
export function handleQtyStepperClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn || btn.disabled) return false;
  const action = btn.dataset.action;

  // "remove" action — explicit remove button
  if (action === "remove") {
    const ruuid = btn.dataset.uuid;
    if (ruuid) {
      btn.disabled = true;
      _cartMgr
        .remove(ruuid)
        .catch((err) => {
          showToast(getErrorMessage(err), "error");
        })
        .finally(() => {
          btn.disabled = false;
        });
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
  const currentQty = _cartMgr.getQuantity(uuid);

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
          await _cartMgr.remove(uuid);
          return;
        }
      }
      await _cartMgr.setQuantity(uuid, newQty);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      _cartMgr.load().catch(() => {});
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
export function handleQtyInputChange(e) {
  if (!e.target.classList.contains("qty-input")) return;
  const input = e.target;
  const stepper = input.closest(".qty-stepper");
  const uuid = input.dataset.uuid || stepper?.dataset.variant || "";
  if (!uuid) return;
  const rawQty = parseInt(input.value, 10);
  if (isNaN(rawQty) || rawQty < 1) {
    input.value = _cartMgr.getQuantity(uuid) || 1;
    return;
  }
  input.disabled = true;
  (async () => {
    try {
      const limits = await getVariantLimits(uuid);
      const newQty = window.SpaceIS.snapQuantity(rawQty, limits);
      if (newQty < limits.min) {
        await _cartMgr.remove(uuid);
        return;
      }
      input.value = newQty;
      await _cartMgr.setQuantity(uuid, newQty);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      input.value = _cartMgr.getQuantity(uuid) || 1;
    } finally {
      input.disabled = false;
    }
  })();
}

// ── Discount section ──────────────────────────────────────────────────────────

/**
 * Render the discount code section (apply form or active badge) into containerEl.
 * @param {Element} containerEl  Target element whose innerHTML will be replaced.
 * @param {Object}  [opts]       Optional ID overrides: inputId, applyId, removeId.
 */
export function renderDiscountSection(containerEl, opts) {
  opts = opts || {};
  const inputId = opts.inputId || "shared-discount-input";
  const applyId = opts.applyId || "shared-discount-apply";
  const removeId = opts.removeId || "shared-discount-remove";

  if (_cartMgr.hasDiscount) {
    containerEl.innerHTML =
      '<div class="discount-active">' +
        `<span>Code: <strong>${esc(_cartMgr.discount.code)}</strong></span>` +
        `<span class="discount-active-pct">-${_cartMgr.discount.percentage_discount}%</span>` +
        `<button class="discount-remove" id="${removeId}">Remove</button>` +
      "</div>";
    document.getElementById(removeId).addEventListener("click", () => {
      removeDiscountCode();
    });
  } else {
    containerEl.innerHTML =
      '<div class="discount-row">' +
        `<input type="text" placeholder="Discount code" id="${inputId}" autocomplete="off">` +
        `<button class="discount-apply" id="${applyId}">Apply</button>` +
      "</div>";
    document.getElementById(applyId).addEventListener("click", () => {
      const code = document.getElementById(inputId).value.trim();
      if (!code) return;
      _cartMgr
        .applyDiscount(code)
        .then(() => {
          showToast("Discount applied!", "success");
        })
        .catch((e) => {
          showToast(getErrorMessage(e) || "Invalid code", "error");
        });
    });
  }
}

/**
 * Render the cart price summary (subtotal, discount, total) into containerEl.
 * @param {Element} containerEl  Target element whose innerHTML will be replaced.
 * @param {Object}  [opts]       Optional labels: header, subtotalLabel, totalLabel.
 */
export function renderCartSummary(containerEl, opts) {
  opts = opts || {};
  const itemCount = _cartMgr.totalQuantity;
  let html = "";
  html += `<div class="cart-summary-header">${opts.header || "Subtotal"} (${itemCount})</div>`;
  html += `<div class="cart-summary-row"><span>${opts.subtotalLabel || "Subtotal"}</span><span>${fp(_cartMgr.regularPrice)}</span></div>`;

  const discountAmount = _cartMgr.regularPrice - _cartMgr.finalPrice;
  if (discountAmount > 0) {
    const discountLabel =
      _cartMgr.hasDiscount && _cartMgr.discount
        ? `Discount (${_cartMgr.discount.percentage_discount}%)`
        : "Discount";
    html += `<div class="cart-summary-row cart-summary-discount"><span>${discountLabel}</span><span>-${fp(discountAmount)}</span></div>`;
  }

  html += `<div class="cart-summary-total"><span>${opts.totalLabel || "Total"}</span><span>${fp(_cartMgr.finalPrice)}</span></div>`;
  containerEl.innerHTML = html;
}

// ── Skeleton loaders ──────────────────────────────────────────────────────────

export function renderSkeletons(containerId, count) {
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

// ── Cart drawer ───────────────────────────────────────────────────────────────

export function renderCartDrawer() {
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
      "</div>" +
      // Body: scrollable items
      '<div class="drawer-body" id="cart-items"></div>' +
      // Footer: discount → summary panel → 2 action buttons
      '<div class="drawer-footer" id="cart-footer" style="display:none">' +
        '<div id="discount-section"></div>' +
        '<div class="cart-summary-panel" id="cart-totals"></div>' +
        '<div class="cart-actions">' +
          '<button class="cart-action-primary" id="go-checkout-btn">' +
            'Proceed to checkout <span style="margin-left:6px">&#8594;</span>' +
          "</button>" +
          '<button class="cart-action-secondary" id="go-cart-btn">View cart</button>' +
        "</div>" +
      "</div>" +
    "</div>";

  // Template for cart item — cloned per item in renderCartItems()
  const tpl = document.createElement("template");
  tpl.id = "cart-item-tpl";
  tpl.innerHTML =
    '<li class="cart-item">' +
      '<div class="cart-item-img-wrap"></div>' +
      '<div class="cart-item-details">' +
        '<div class="cart-item-top">' +
          '<div class="cart-item-info">' +
            '<div class="cart-item-name"></div>' +
            '<div class="cart-item-variant"></div>' +
            '<div class="cart-item-package"></div>' +
          "</div>" +
          '<button class="cart-item-remove" data-action="remove" aria-label="Remove">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
          "</button>" +
        "</div>" +
        '<div class="cart-item-bottom">' +
          '<div class="cart-item-prices"></div>' +
          '<div class="cart-item-qty"></div>' +
        "</div>" +
      "</div>" +
    "</li>";
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

export function toggleCart() {
  _cartOpen = !_cartOpen;
  const overlay = document.getElementById("overlay");
  const drawer = document.getElementById("drawer");
  if (overlay) overlay.classList.toggle("open", _cartOpen);
  if (drawer) drawer.classList.toggle("open", _cartOpen);
  document.body.style.overflow = _cartOpen ? "hidden" : "";
}

// T9 fix: replaced confirm() with immediate clear + toast notification.
// No blocking dialog — user sees "Cart cleared" feedback via toast.
export function clearCart() {
  _cartMgr.clear();
  showToast("Cart cleared", "default");
}

// ── Cart rendering (reactive) ─────────────────────────────────────────────────

export function renderCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  const count = _cartMgr.totalQuantity;
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

export function renderCartItems() {
  const itemsEl = document.getElementById("cart-items");
  const footerEl = document.getElementById("cart-footer");
  const titleEl = document.getElementById("drawer-title");
  if (!itemsEl) return;

  // Update header count
  const totalQty = _cartMgr.totalQuantity;
  if (titleEl) titleEl.textContent = `CART${totalQty > 0 ? ` (${totalQty})` : ""}`;

  // Show spinner only on initial load, not during mutations
  if (_cartMgr.isLoading && !_cartMgr.cart) {
    itemsEl.innerHTML = '<div class="spinner"></div>';
    if (footerEl) footerEl.style.display = "none";
    return;
  }

  if (_cartMgr.isEmpty) {
    itemsEl.innerHTML =
      '<div class="empty-state">' +
        '<div class="icon">&#128722;</div>' +
        "<p>Your cart is empty</p>" +
        '<button class="cart-action-secondary" id="continue-shopping-btn" style="margin-top:16px">Continue Shopping</button>' +
      "</div>";
    // Attach event handler instead of inline onclick
    const continueBtn = document.getElementById("continue-shopping-btn");
    if (continueBtn) continueBtn.addEventListener("click", () => toggleCart());
    if (footerEl) footerEl.style.display = "none";
    return;
  }

  if (footerEl) footerEl.style.display = "";

  // Try incremental update — only patch qty/prices if same items exist
  const existingItems = itemsEl.querySelectorAll(".cart-item");
  const currentUuids = _cartMgr.items.map((i) => i.variant?.uuid ?? "");
  const existingUuids = Array.from(existingItems).map((el) => {
    const rm = el.querySelector(".cart-item-remove");
    return rm ? rm.dataset.uuid : "";
  });

  const sameItems =
    currentUuids.length === existingUuids.length &&
    currentUuids.every((uuid, i) => uuid === existingUuids[i]);
  const prevDiscountEl = document.getElementById("discount-section");
  const hadDiscount = prevDiscountEl?.querySelector(".discount-active");
  const sameDiscount = !!hadDiscount === _cartMgr.hasDiscount;

  if (sameItems && sameDiscount && existingItems.length > 0) {
    // Incremental update — only patch changed values (no DOM rebuild)
    _cartMgr.items.forEach((item, i) => {
      const li = existingItems[i];
      const displayQty = window.SpaceIS.getItemQty(item);

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

    _cartMgr.items.forEach((item) => {
      const clone = tpl.content.cloneNode(true);
      const imgWrap = clone.querySelector(".cart-item-img-wrap");
      const nameEl = clone.querySelector(".cart-item-name");
      const variantEl = clone.querySelector(".cart-item-variant");
      const packageEl = clone.querySelector(".cart-item-package");
      const removeBtn = clone.querySelector(".cart-item-remove");
      const pricesEl = clone.querySelector(".cart-item-prices");
      const qtyEl = clone.querySelector(".cart-item-qty");

      const variantUuid = item.variant?.uuid ?? "";
      const imgSrc = window.SpaceIS.getCartItemImage(item);
      const displayQty = window.SpaceIS.getItemQty(item);
      const showVariant =
        item.variant &&
        item.shop_product &&
        item.variant.name !== item.shop_product?.name;

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
        "</div>";

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

// ── Discount code actions ─────────────────────────────────────────────────────

export async function applyDiscountCode() {
  const input = document.getElementById("discount-input");
  if (!input) return;
  const code = input.value.trim();
  if (!code) {
    showToast("Enter discount code", "error");
    return;
  }

  const btn = document.getElementById("discount-apply-btn");
  // T8 fix: guard button against concurrent requests
  if (btn) {
    btn.disabled = true;
    btn.textContent = "...";
  }

  try {
    await _cartMgr.applyDiscount(code);
    showToast("Discount applied!", "success");
  } catch (err) {
    showToast(getErrorMessage(err) || "Invalid code", "error");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Apply";
    }
  }
}

// T8 fix: removeDiscount now guarded with isSubmitting flag to prevent double-click race.
export function removeDiscountCode() {
  const removeBtn = document.getElementById("discount-remove-btn");
  if (removeBtn) {
    removeBtn.disabled = true;
  }
  _cartMgr
    .removeDiscount()
    .catch((err) => {
      showToast(getErrorMessage(err), "error");
    })
    .finally(() => {
      if (removeBtn) removeBtn.disabled = false;
    });
}
