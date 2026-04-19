// examples/vanilla/shared/cart.js
// Cart drawer UI, cart render, qty steppers, discount section.
// client + cartMgr are imported lazily (used inside functions only — no top-level call)
// to avoid circular dep with main.js.

import { esc, fp, getErrorMessage, PLACEHOLDER_SVG_SM } from "./format.js";
import { showToast } from "./toast.js";

// Resolved at runtime via getter injected from main.js
let _client;
let _cartMgr;
// Limits cache shared across cart drawer, cart page, and checkout
const _limitsCache = {};
// Tracks containers that already have their discount-section click delegate
// attached — prevents stacking listeners on re-render (renderDiscountSection
// is called on every cart mutation).
const _discountWired = new WeakSet();

export function initCart(client, cartMgr) {
  _client = client;
  _cartMgr = cartMgr;
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
        `<button class="discount-remove" id="${removeId}" data-discount-action="remove">Remove</button>` +
      "</div>";
  } else {
    containerEl.innerHTML =
      '<div class="discount-row">' +
        `<input type="text" placeholder="Discount code" id="${inputId}" autocomplete="off" data-discount-input>` +
        `<button class="discount-apply" id="${applyId}" data-discount-action="apply">Apply</button>` +
      "</div>";
  }

  // Attach a single delegated click handler per container. innerHTML above
  // swaps children on every cart mutation; the listener lives on the stable
  // parent and resolves the action via a data attribute on the target.
  if (_discountWired.has(containerEl)) return;
  _discountWired.add(containerEl);

  containerEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-discount-action]");
    if (!btn || !containerEl.contains(btn)) return;
    if (btn.dataset.discountAction === "remove") {
      removeDiscountCode();
      return;
    }
    if (btn.dataset.discountAction === "apply") {
      const input = containerEl.querySelector("[data-discount-input]");
      const code = (input?.value || "").trim();
      if (!code) return;
      _cartMgr
        .applyDiscount(code)
        .then(() => showToast("Discount applied!", "success"))
        .catch((err) => showToast(getErrorMessage(err) || "Invalid code", "error"));
    }
  });

  containerEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const input = e.target.closest("[data-discount-input]");
    if (!input) return;
    const applyBtn = containerEl.querySelector("[data-discount-action=\"apply\"]");
    applyBtn?.click();
  });
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
